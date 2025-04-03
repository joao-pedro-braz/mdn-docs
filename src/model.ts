import type { CancellationToken, DefinitionLink, Position, TextDocument } from "vscode";

export class Model {
    public meta = {} as any;

    constructor(
        public document: TextDocument,
        public position: Position,
        public word: string,
        public token: CancellationToken,
    ) { }

    /**
     * Returns a string representation of the current object.
     * 
     * @returns A string that contains the document URI and position details in the format
     * "uri at line:character".
     */
    public toString(): string {
        return `${this.document.uri} at ${this.position.line}:${this.position.character}`;
    }
}
