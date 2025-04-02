import { MarkdownString, OutputChannel, workspace } from "vscode";
import { CacheStorageService } from "./cache";
import { EXTENSION_NAME, ExtensionSetting } from "./constants";
import { DOMParser, MIME_TYPE, Node, XMLSerializer, type Element } from "@xmldom/xmldom";

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
        const language = this.getLanguage();
        const url = `https://developer.mozilla.org/${language}/docs/Web/HTML/Element/${element}`;
        const cacheKey = `mdn-docs-html-element-${element}-${language}`;

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
        const language = this.getLanguage();
        const url = `https://developer.mozilla.org/${language}/docs/Web/HTML/Global_attributes/${attribute}`;
        const cacheKey = `mdn-docs-html-global-attribute-${attribute}-${language}`;

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
        const language = this.getLanguage();
        const url = `https://developer.mozilla.org/${language}/docs/Web/HTML/Attributes/${attribute}`;
        const cacheKey = `mdn-docs-html-element-attribute-${attribute}-${language}`;

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
     * Gets the language setting from the configuration.
     * @returns The language setting from the configuration.
     */
    private getLanguage(): string {
        const config = workspace.getConfiguration(EXTENSION_NAME);
        return config.get(ExtensionSetting.language, "en-US") as string;
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

        const dom = new DOMParser({
            onError: (error) => {
                this.log(`DOMParser error: ${error}`);
            }
        }).parseFromString(html, MIME_TYPE.HTML);

        // Try to find the main content section using DOM methods
        const sectionContent = dom.getElementsByClassName("section-content")
            .filter(element => element.tagName === 'div')[0];
        if (sectionContent) {
            this.log("Found section-content element, extracting content");
            return this.cleanDocumentation(sectionContent);
        }

        // Fallback to finding any section element
        const section = dom.getElementsByTagName("section")[0];
        if (section) {
            this.log("Found section element, extracting content");
            return this.cleanDocumentation(section);
        }

        // Try finding article content as another fallback
        const article = dom.getElementsByTagName("article")[0];
        if (article) {
            this.log("Found article element, extracting content");
            return this.cleanDocumentation(article);
        }

        this.log("No content elements found in the DOM");
        return undefined;
    }

    /**
     * Cleans HTML content by removing tags and normalizing whitespace.
     * @param html HTML content to clean.
     * @returns Cleaned text.
     */
    private cleanDocumentation(document: Element): string {
        this.log(`Cleaning HTML content`);

        // Replace HTML anchors href with a proper link to the MDN page
        const anchors = document.getElementsByTagName("a");
        for (let i = 0; i < anchors.length; i++) {
            const anchor = anchors[i];
            const href = anchor.getAttribute("href");
            if (href) {
                anchor.setAttribute("href", `https://developer.mozilla.org${href}`);
            }
        }

        // Remove non-allowed tags
        const allowedTags = ['a', 'code', 'div', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'section', 'span', 'strong'];
        let elementsToCheck = Array.from(document.childNodes);
        while (elementsToCheck.length) {
            const newElementsToCheck = [] as Node[];
            for (let i = elementsToCheck.length - 1; i >= 0; i--) {
                const element = elementsToCheck[i];
                if (element.nodeType !== Node.ELEMENT_NODE) {
                    continue;
                }

                if ( !allowedTags.includes(element.nodeName.toLowerCase())) {
                    element.parentNode?.removeChild?.(element);
                    elementsToCheck.splice(i, 1);
                }

                newElementsToCheck.push(...Array.from(element.childNodes));
            }
            elementsToCheck = newElementsToCheck;
        }

        const result = new XMLSerializer().serializeToString(document);
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
