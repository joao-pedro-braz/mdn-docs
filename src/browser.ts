import bcd, { type BrowserName, type CompatStatement, type SimpleSupportStatement, type SupportStatement } from "@mdn/browser-compat-data";
import type { OutputChannel } from "vscode";


export class BrowserCompatDataLoader {
    private static browserNames = {
        chrome: "Chrome",
        chrome_android: "Chrome Android",
        deno: "Deno",
        edge: "Edge",
        firefox: "Firefox",
        firefox_android: "Firefox Android",
        ie: "IE",
        nodejs: "Node.js",
        oculus: "Oculus",
        opera: "Opera",
        opera_android: "Opera Android",
        safari: "Safari",
        safari_ios: "Safari iOS",
        samsunginternet_android: "Samsung Internet Android",
        webview_android: "WebView Android",
        webview_ios: "WebView iOS",
    } satisfies Record<BrowserName, string>;

    constructor(
        private outputChannel: OutputChannel,
    ) {
        this.log("Initialized");
    }

    /**
     * Retrieves browser compatibility data for a specified HTML element.
     * 
     * @param element - The name of the HTML element to get compatibility data for
     * @returns The parsed compatibility data for the element, or undefined if no data is found
     */
    public getBrowserCompatDataForElement(element: string) {
        const compat = bcd.html.elements[element.toLowerCase()]?.__compat
        if (!compat) {
            this.log(`No compat data found for element: ${element}`);
            return undefined;
        }

        return this.parseCompat(element, compat);
    }

    /**
     * Retrieves browser compatibility data for a global HTML attribute.
     * 
     * @param element - The name of the global attribute to retrieve compatibility data for.
     * @returns The parsed compatibility data for the attribute, or undefined if no data is found.
     */
    public getBrowserCompatDataForGlobalAttribute(element: string) {
        const compat = bcd.html.global_attributes[element.toLowerCase()]?.__compat
        if (!compat) {
            this.log(`No compat data found for global attribute: ${element}`);
            return undefined;
        }

        return this.parseCompat(element, compat);
    }

    /**
     * Retrieves browser compatibility data for a specific HTML element attribute.
     * 
     * @param element - The HTML element name (case-insensitive)
     * @param attribute - The attribute name of the HTML element (case-insensitive)
     * @returns Browser compatibility data for the specified element attribute, or undefined if no data is found
     */
    public getBrowserCompatDataForElementAttribute(element: string, attribute: string) {
        const compat = bcd.html.elements[element.toLowerCase()][attribute.toLowerCase()]?.__compat
        if (!compat) {
            this.log(`No compat data found for element: ${element}`);
            return undefined;
        }

        return this.parseCompat(element, compat);
    }

    /**
     * Parses compatibility data for a specific element.
     * 
     * This method processes the support statements from the compatibility data
     * and transforms them into an array of browser compatibility summaries.
     * 
     * @param element - The name of the HTML/CSS/JS element or feature
     * @param compat - The compatibility statement containing support information
     * @returns An array of browser compatibility summaries, with falsy values filtered out
     */
    private parseCompat(element: string, compat: CompatStatement) {
        const supportStatement = compat.support;
        return Object.entries(supportStatement)
            .map(
                ([browser, support]) =>
                    this.parseSupportStatement(element, browser, support)
            ).filter(Boolean) as BrowserCompatDataLoader.BrowserCompatSummary[];
    }

    /**
     * Parses a SupportStatement for a specific browser and HTML element.
     * 
     * @param element - The HTML element for which browser compatibility is being checked
     * @param browser - The browser identifier (e.g., 'chrome', 'firefox', 'safari')
     * @param support - The support statement to parse, which can be either a single support statement or an array of support statements
     * @returns A summarized browser compatibility data object or undefined if parsing fails
     * 
     * @remarks
     * When an array of support statements is provided, currently only the first support statement is processed.
     * Future implementation may handle multiple support statements.
     */
    private parseSupportStatement(
        element: string,
        browser: string,
        support: SupportStatement
    ): BrowserCompatDataLoader.BrowserCompatSummary | undefined {
        if (Array.isArray(support)) {
            // TODO: Consider handling multiple support statements
            return this.parseSimpleSupportStatement(element, browser, support[0]);
        }

        return this.parseSimpleSupportStatement(element, browser, support);
    }

    /**
     * Parses a simple support statement to extract browser compatibility summary.
     * 
     * @param element - The HTML element or feature name being checked for compatibility
     * @param browser - The browser identifier (e.g., 'chrome', 'firefox')
     * @param statement - The SimpleSupportStatement object containing version information
     * @returns A BrowserCompatSummary object if version information is available, otherwise undefined
     */
    private parseSimpleSupportStatement(
        element: string,
        browser: string,
        statement: SimpleSupportStatement,
    ): BrowserCompatDataLoader.BrowserCompatSummary | undefined {
        const version = statement.version_added || statement.version_removed;
        if (typeof version === "string") {
            return {
                browser: BrowserCompatDataLoader.browserNames[browser as BrowserName] || browser,
                version: version,
                present: !!statement.version_added
            };
        } else {
            this.log(`No browser or version found for element: ${element}`);
        }

        return undefined;
    }


    /**
     * Logs a message to the output channel.
     * @param content The content to log.
     */
    private log(content: string) {
        this.outputChannel.appendLine(`[BrowserCompatDataLoader] ${content}`);
    }
}

export namespace BrowserCompatDataLoader {
    export type BrowserCompatSummary = {
        browser: string;
        version: string;
        present: boolean;
    }
}
