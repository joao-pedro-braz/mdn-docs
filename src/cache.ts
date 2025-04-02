import { Disposable, ExtensionContext, FileType, Uri, workspace, type OutputChannel } from "vscode";
import { EXTENSION_VERSION } from "./constants";

export interface CacheItem<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
    version: string; // Store the extension version
}

export class CacheStorageService extends Disposable {
    private static instance: CacheStorageService | null = null;
    private memoryCache: Map<string, CacheItem<any>> = new Map();
    private cacheDir: Uri;
    private maxCacheAge: number = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    /**
     * Get the singleton instance of CacheStorageService.
     * @returns The singleton instance of CacheStorageService.
     * @throws Will throw an error if the service is not initialized.
     */
    public static getInstance(): CacheStorageService {
        if (!CacheStorageService.instance) {
            throw new Error('CacheStorageService not initialized. Call CacheStorageService.initialize() first.');
        }
        return CacheStorageService.instance;
    }

    /**
     * Initialize the singleton instance.
     * @param outputChannel The output channel for logging.
     * @param context The extension context.
     * @returns The singleton instance of CacheStorageService.
     */
    public static initialize(outputChannel: OutputChannel, context: ExtensionContext): CacheStorageService {
        if (!CacheStorageService.instance) {
            CacheStorageService.instance = new CacheStorageService(outputChannel, context);
        }
        return CacheStorageService.instance;
    }

    /**
     * Private constructor to enforce singleton pattern.
     * @param outputChannel The output channel for logging.
     * @param context The extension context.
     */
    private constructor(private outputChannel: OutputChannel, private context: ExtensionContext) {
        super(() => this.dispose());
        this.context.subscriptions.push(this);

        this.log(`Initializing CacheStorageService with cache directory: ${this.context.globalStorageUri.fsPath}`);
        this.cacheDir = Uri.joinPath(this.context.globalStorageUri, 'cache');
        this.ensureCacheDirExists();
    }

    /**
     * Dispose of the loader and clear the cache.
     */
    public override dispose() {
        this.memoryCache.clear();
    }

    /**
     * Get data from cache, or fetch it if not available.
     * @param key The cache key.
     * @param fetchFn The function to fetch data if not in cache.
     * @returns The cached or fetched data.
     */
    public async getOrFetch<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
        // Try memory cache first
        const memItem = this.memoryCache.get(key);
        if (memItem && memItem.expiresAt > Date.now() && memItem.version === EXTENSION_VERSION) {
            this.log(`Cache hit (memory): ${key}`);
            return memItem.data;
        }

        // Try disk cache
        try {
            const diskItem = await this.readFromDiskCache<T>(key);
            if (diskItem && diskItem.expiresAt > Date.now() && diskItem.version === EXTENSION_VERSION) {
                this.log(`Cache hit (disk): ${key}`);
                // Refresh memory cache
                this.memoryCache.set(key, diskItem);
                return diskItem.data;
            }
        } catch (error) {
            this.log(`Error reading from disk cache: ${error}`);
        }

        // Fetch new data
        this.log(`Cache miss: ${key}, fetching data...`);
        const data = await fetchFn();

        // Store in cache
        const cacheItem: CacheItem<T> = {
            data,
            timestamp: Date.now(),
            expiresAt: Date.now() + this.maxCacheAge,
            version: EXTENSION_VERSION
        };

        this.memoryCache.set(key, cacheItem);
        await this.writeToDiskCache(key, cacheItem);

        return data;
    }

    /**
     * Clear cache items older than maxAge.
     * @returns A promise that resolves when the cache is cleaned.
     */
    public async cleanCache(): Promise<void> {
        const now = Date.now();

        // Clean memory cache
        for (const [key, item] of this.memoryCache.entries()) {
            if (item.expiresAt <= now) {
                this.memoryCache.delete(key);
                this.log(`Removed expired memory cache: ${key}`);
            }
        }

        // Clean disk cache
        try {
            const entries = await workspace.fs.readDirectory(this.cacheDir);
            for (const [fileName, fileType] of entries) {
                if (fileType === FileType.File) {
                    const fileUri = Uri.joinPath(this.cacheDir, fileName);
                    try {
                        const content = await workspace.fs.readFile(fileUri);
                        const contentStr = Buffer.from(content).toString('utf8');
                        const item: CacheItem<any> = JSON.parse(contentStr);

                        if (item.expiresAt <= now) {
                            await workspace.fs.delete(fileUri);
                            this.log(`Removed expired disk cache: ${fileName}`);
                        }
                    } catch (error) {
                        this.log(`Error parsing cache file ${fileName}: ${error}`);
                    }
                }
            }
        } catch (error) {
            this.log(`Error cleaning disk cache: ${error}`);
        }
    }

    /**
     * Read data from disk cache.
     * @param key The cache key.
     * @returns The cached item or null if not found.
     */
    private async readFromDiskCache<T>(key: string): Promise<CacheItem<T> | null> {
        const fileUri = Uri.joinPath(this.cacheDir, `${key}.json`);

        try {
            await workspace.fs.stat(fileUri);
        } catch {
            return null; // File doesn't exist
        }

        const content = await workspace.fs.readFile(fileUri);
        return JSON.parse(Buffer.from(content).toString('utf8')) as CacheItem<T>;
    }

    /**
     * Write data to disk cache.
     * @param key The cache key.
     * @param item The cache item to write.
     */
    private async writeToDiskCache<T>(key: string, item: CacheItem<T>): Promise<void> {
        const fileUri = Uri.joinPath(this.cacheDir, `${key}.json`);
        const content = Buffer.from(JSON.stringify(item), 'utf8');
        await workspace.fs.writeFile(fileUri, content);
    }

    /**
     * Ensure the cache directory exists.
     * @returns A promise that resolves when the directory is created or already exists.
     */
    private async ensureCacheDirExists(): Promise<void> {
        try {
            await workspace.fs.stat(this.cacheDir);
        } catch {
            // Directory doesn't exist, create it
            await workspace.fs.createDirectory(this.cacheDir);
            this.log(`Created cache directory at ${this.cacheDir.fsPath}`);
        }
    }

    /**
     * Log a message to the output channel.
     * @param content The message to log.
     */
    private log(content: string) {
        this.outputChannel.appendLine(`[CacheStorageService] ${content}`);
    }
}
