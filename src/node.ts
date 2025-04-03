import { type Document, type Element, type Node } from "@xmldom/xmldom";
import type { OutputChannel } from "vscode";

export class NodeManipulator {


    constructor(
        private outputChannel: OutputChannel,
    ) {
        this.log("Initialized");
    }

    /**
     * Iterates over all elements with the specified tag name.
     * @param document The document element to search in
     * @param tagName The tag name to search for
     * @param fn The function to call for each matching element
     */
    public forEachTag(document: Element | Document, tagName: string, fn: (element: Element, index: number) => void) {
        const elements = document.getElementsByTagName(tagName);
        for (let i = 0; i < elements.length; i++) {
            fn(elements[i], i);
        }
    }

    /**
     * Gets all elements with the specified class name.
     * @param document The document element to search in
     * @param className The class name to search for
     * @returns An array of matching elements
     */
    public getElementsByClassName(document: Element | Document, className: string): Element[] {
        return Array.from(document.getElementsByClassName(className));
    }

    /**
     * Gets the first element with the specified class name and tag.
     * @param document The document element to search in
     * @param className The class name to search for
     * @param tagName The tag name to filter by
     * @returns The first matching element or undefined if none found
     */
    public getFirstElementByClassAndTag(document: Element | Document, className: string, tagName: string): Element | undefined {
        const elements = this.getElementsByClassName(document, className);
        return elements.find(element => element.tagName.toLowerCase() === tagName.toLowerCase());
    }

    /**
     * Replaces an element with a new element of the specified tag.
     * @param element The element to replace
     * @param newTagName The tag name for the new element
     */
    public replaceElementWithTag(element: Element | Document, newTagName: string): void {
        element.parentNode?.removeChild?.(element);
        const newElement = element.ownerDocument?.createElement?.(newTagName)!;
        element.parentNode?.insertBefore?.(newElement, element);
    }

    /**
     * Removes a node from the DOM.
     * @param node The node to remove
     */
    public removeNode(node: Node): void {
        node.parentNode?.removeChild?.(node);
    }

    /**
     * Recursively walks through the DOM tree and applies a function to each node.
     * @param document The document element to start from
     * @param next The function to call for each node
     */
    public walkRecursive(document: Element | Document, next: (node: Node) => NodeManipulator.WalkRecursive): void {
        let nodesToCheck = Array.from(document.childNodes);
        while (nodesToCheck.length) {
            const newNodesToCheck = [] as Node[];
            for (let i = nodesToCheck.length - 1; i >= 0; i--) {
                const node = nodesToCheck[i];
                const result = next(node);
                if (result === NodeManipulator.WalkRecursive.SKIP) {
                    continue;
                }

                newNodesToCheck.push(...Array.from(node.childNodes));
            }

            nodesToCheck = newNodesToCheck;
        }
    }

    private log(content: string): void {
        this.outputChannel.appendLine(`[DocumentManipulator] ${content}`);
    }
}

export namespace NodeManipulator {
    export enum WalkRecursive {
        SKIP,
        MERGE,
    }
}