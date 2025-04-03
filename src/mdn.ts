import { DOMParser, MIME_TYPE, Node, XMLSerializer, type Element } from "@xmldom/xmldom";
import { get as getObject } from "lodash";
import { MarkdownString, OutputChannel, workspace } from "vscode";
import { CacheStorageService } from "./cache";
import { EXTENSION_NAME, ExtensionSetting } from "./constants";
import { NodeManipulator } from "./node";
import type { BrowserCompatDataLoader } from "./browser";

export class MdnDocsLoader {
    constructor(
        private outputChannel: OutputChannel,
        private nodeManipulator: NodeManipulator,
        private browserCompatDataLoader: BrowserCompatDataLoader,
        private cacheStorageService: CacheStorageService,
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
        const documentationUrl = `https://developer.mozilla.org/${language}/docs/Web/HTML/Element/${element}`;
        const cacheKey = `mdn-docs-html-element-${element}-${language}`;

        try {
            const documentation = await this.cacheStorageService.getOrFetch(
                cacheKey,
                () => this.fetch(element, documentationUrl)
            );
            if (!documentation) {
                this.log(`No documentation found for ${element}`);
                return undefined;
            }

            const browserCompatSummary = this.browserCompatDataLoader
                .getBrowserCompatDataForElement(element);

            return this.buildMarkdownString(documentation, documentationUrl, browserCompatSummary);
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
        const documentationUrl = `https://developer.mozilla.org/${language}/docs/Web/HTML/Global_attributes/${attribute}`;
        const cacheKey = `mdn-docs-html-global-attribute-${attribute}-${language}`;

        try {
            const documentation = await this.cacheStorageService.getOrFetch(
                cacheKey,
                () => this.fetch(attribute, documentationUrl)
            );
            if (!documentation) {
                this.log(`No documentation found for ${attribute}`);
                return undefined;
            }

            const browserCompatSummary = this.browserCompatDataLoader
                .getBrowserCompatDataForGlobalAttribute(attribute);

            return this.buildMarkdownString(documentation, documentationUrl, browserCompatSummary);
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
    public async fetchElementAttribute(attribute: string, element?: string): Promise<MarkdownString | undefined> {
        this.log(`Fetching docs for HTML element attribute: ${attribute}`);
        const language = this.getLanguage();
        const documentationUrl = `https://developer.mozilla.org/${language}/docs/Web/HTML/Attributes/${attribute}`;
        const cacheKey = `mdn-docs-html-element-attribute-${attribute}-${language}`;

        try {
            const documentation = await this.cacheStorageService.getOrFetch(
                cacheKey,
                () => this.fetch(attribute, documentationUrl)
            );
            if (!documentation) {
                this.log(`No documentation found for ${attribute}`);
                return undefined;
            }

            let browserCompatSummary: BrowserCompatDataLoader.BrowserCompatSummary[] | undefined;
            if (element) {
                browserCompatSummary = this.browserCompatDataLoader
                    .getBrowserCompatDataForElementAttribute(element, attribute);
            }

            return this.buildMarkdownString(documentation, documentationUrl, browserCompatSummary);
        } catch (error) {
            this.log(`Failed to fetch documentation for ${attribute}: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    /**
     * Fetches MDN documentation for a given URL.
     * @param element The HTML element to fetch documentation for.
     * @param url The URL to fetch documentation from.
     * @returns A promise that resolves to the response.
     * @throws An error if the fetch fails.
     */
    private async fetch(element: string, url: string): Promise<string | undefined> {
        try {
            const response = await fetch(url, { mode: "cors", redirect: 'follow' });
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
            return undefined;
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
    private buildMarkdownString(
        content: string,
        url: string,
        browserCompatSummary: BrowserCompatDataLoader.BrowserCompatSummary[] | undefined
    ): MarkdownString | undefined {
        const markdownString = new MarkdownString(content);
        markdownString.supportHtml = true;

        // Add browser compatibility information
        if (browserCompatSummary) {
            const browserCompatList = browserCompatSummary
                .map(
                    item =>
                        `${item.browser} (<i>${item.present ? '>= ' : '<= '}</i> <strong>v${item.version}</strong>)`
                )
                .join(", ");
            markdownString.appendMarkdown(`<p><small><strong>Browser Compatibility</strong>: ${browserCompatList}</small></p>`);
        }

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

        // Try to find the main content section using the NodeManipulator
        const document = new DOMParser().parseFromString(html, MIME_TYPE.HTML);
        const sectionContent = this.nodeManipulator.getFirstElementByClassAndTag(document, "section-content", "div");
        if (sectionContent) {
            this.log("Found section-content element, extracting content");
            return this.cleanDocumentation(sectionContent);
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
        this.nodeManipulator.forEachTag(document, 'a', anchor => {
            const href = anchor.getAttribute("href");
            anchor.setAttribute("href", `https://developer.mozilla.org${href}`);
        });

        // Remove non-allowed tags
        const allowedTags = ['a', 'code', 'div', 'p', 'span', 'strong'];
        this.nodeManipulator.walkRecursive(document, node => {
            if (node.nodeType !== Node.ELEMENT_NODE) { return NodeManipulator.WalkRecursive.SKIP; }

            const tagName = node.nodeName.toLowerCase();
            if (!allowedTags.includes(tagName)) {
                this.log(`Removing disallowed tag: ${tagName}`);
                this.nodeManipulator.removeNode(node);
            }

            return NodeManipulator.WalkRecursive.MERGE;
        });

        const result = new XMLSerializer().serializeToString(document);
        this.log(`Cleaned text is ${result.length} bytes`);
        return result;
    }

    /**
     * Parses browser support JSON data
     * @param jsonString The JSON string to parse
     * @returns Parsed object or undefined if parsing fails
     */
    private parseBrowserSupport(rawBrowserSupport: string | undefined, pathToSupport: string): string[] | undefined {
        if (!rawBrowserSupport) {
            this.log("No browser support data available");
            return undefined;
        }

        try {
            const browserSupport = JSON.parse(rawBrowserSupport);
            const support = getObject(browserSupport, pathToSupport);
            return Object.keys(support);
        } catch (error) {
            this.log(`Failed to parse browser support data: ${error instanceof Error ? error.message : String(error)}`);
            return undefined;
        }
    }

    /**
     * Logs messages to the output channel.
     * @param content The message to log.
     */
    private log(content: string) {
        this.outputChannel.appendLine(`[MdnDocsLoader] ${content}`);
    }
}

