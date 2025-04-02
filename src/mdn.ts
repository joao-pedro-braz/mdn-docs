import { MarkdownString, OutputChannel } from "vscode";
import { CacheStorageService } from "./cache";

export class MdnDocsLoader {
    constructor(
        private outputChannel: OutputChannel,
        private cacheStorageService: CacheStorageService
    ) {
        this.log("MdnDocsLoader initialized");
    }

    /**
     * Fetches MDN documentation for a given HTML Element.
     * @param element The HTML element to fetch documentation for.
     * @returns A promise that resolves to the documentation string.
     * @throws An error if the fetch fails.
     */
    public async fetchHtmlElement(element: string): Promise<MarkdownString | undefined> {
        this.log(`Fetching docs for HTML element: ${element}`);
        const url = `https://developer.mozilla.org/en-US/docs/Web/HTML/Element/${element}`;
        const cacheKey = `mdn-docs-html-element-${element}`;

        try {
            const content = await this.cacheStorageService.getOrFetch(
                cacheKey,
                () => this.fetch(element, cacheKey, url)
            );

            return this.buildMarkdownString(content, url);
        } catch (error) {
            this.log(`Failed to fetch documentation for ${element}: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    /**
     * Fetches MDN documentation for a given Global HTML attribute.
     * @param attribute The HTML attribute to fetch documentation for.
     * @returns A promise that resolves to the documentation string.
     * @throws An error if the fetch fails.
     */
    public async fetchGlobalAttribute(attribute: string): Promise<MarkdownString | undefined> {
        this.log(`Fetching docs for Global HTML attribute: ${attribute}`);
        const url = `https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/${attribute}`;
        const cacheKey = `mdn-docs-html-global-attribute-${attribute}`;

        try {
            const content = await this.cacheStorageService.getOrFetch(
                cacheKey,
                () => this.fetch(attribute, cacheKey, url)
            );

            return this.buildMarkdownString(content, url);
        } catch (error) {
            this.log(`Failed to fetch documentation for ${attribute}: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    /**
     * Fetches MDN documentation for a given HTML element attribute.
     * @param attribute The HTML element attribute to fetch documentation for.
     * @returns A promise that resolves to the documentation string.
     * @throws An error if the fetch fails. 
     */
    public async fetchElementAttribute(attribute: string): Promise<MarkdownString | undefined> {
        this.log(`Fetching docs for HTML element attribute: ${attribute}`);
        const url = `https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/${attribute}`;
        const cacheKey = `mdn-docs-html-element-attribute-${attribute}`;

        try {
            const content = await this.cacheStorageService.getOrFetch(
                cacheKey,
                () => this.fetch(attribute, cacheKey, url)
            );

            return this.buildMarkdownString(content, url);
        } catch (error) {
            this.log(`Failed to fetch documentation for ${attribute}: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    /**
     * Fetches MDN documentation for a given URL.
     * @param element The HTML element to fetch documentation for.
     * @param cacheKey The cache key to use for storing the result.
     * @param url The URL to fetch documentation from.
     * @returns A promise that resolves to the documentation string.
     * @throws An error if the fetch fails.
     */
    private async fetch(element: string, cacheKey: string, url: string): Promise<string | undefined> {
        this.log(`Cache miss for ${cacheKey}, fetching from MDN at ${url}...`);
        try {
            const response = await fetch(url, {
                mode: "cors",
                redirect: 'follow'
            });
            if (!response.ok) {
                this.log(`Error: Failed to fetch MDN docs: ${response.status} ${response.statusText}`);
                throw new Error(`Failed to fetch MDN docs for ${element}: ${response.statusText}`);
            }
            this.log(`Received response for ${element}, status: ${response.status}`);
            const text = await response.text();
            this.log(`Received ${text.length} bytes of HTML content`);
            return this.extractDocumentation(text);
        } catch (error) {
            this.log(`Exception during fetch: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    /**
     * Builds a MarkdownString from the fetched content.
     * @param content The content to build the MarkdownString from.
     * @param url The URL to append to the MarkdownString.
     * @returns A MarkdownString or undefined if no content is provided.
     */
    private buildMarkdownString(content: string | undefined, url: string): MarkdownString | undefined {
        if (!content) {
            this.log("No content to assemble into MarkdownString");
            return undefined;
        }

        const markdownString = new MarkdownString(content);
        markdownString.supportHtml = true;

        // Add reference to the MDN page
        markdownString.appendMarkdown(`\n\n[MDN Reference](${url})`);

        return markdownString;
    }

    /**
     * Extracts the relevant documentation from the MDN page HTML.
     * @param html The HTML content of the MDN page.
     * @returns The extracted documentation as a string.
     */
    private extractDocumentation(html: string): string | undefined {
        this.log(`Extracting documentation from ${html.length} bytes of HTML`);


        // Simple extraction - look for the main content
        const mainContentMatch = html.match(/<div class="section-content">(.+?)<\/div>/s);
        let content: string;
        if (!mainContentMatch) {
            this.log("Primary content pattern not found, trying alternative pattern");

            // Fallback to another common pattern if the first one fails
            const altMatch = html.match(/<section.+?>(.+?)<\/section>/s);
            if (!altMatch) {
                this.log("No content patterns matched");
                return undefined;
            }

            this.log("Alternative pattern matched, cleaning content");
            content = this.cleanHtml(altMatch[1]);
        } else {
            this.log("Primary content pattern matched, cleaning content");
            content = this.cleanHtml(mainContentMatch[1]);
        }

        return content;
    }

    /**
     * Cleans HTML content by removing tags and normalizing whitespace.
     * @param html HTML content to clean.
     * @returns Cleaned text.
     */
    private cleanHtml(html: string): string {
        this.log(`Cleaning HTML content (${html.length} bytes)`);

        // Normalize whitespace
        let result = html
            .replace(/\s+/g, ' ')
            .trim();

        // Replace HTML anchors href with a proper link to the MDN page
        result = result.replace(/<a href="([^"]+)">/g, "<a href=\"https://developer.mozilla.org/$1\">");

        this.log(`Cleaned text is ${result.length} bytes`);
        return result;
    }

    /**
     * Logs messages to the output channel.
     * @param content The message to log.
     */
    private log(content: string) {
        this.outputChannel.appendLine(`[MdnDocsLoader] ${content}`);
    }
}
