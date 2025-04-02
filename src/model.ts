import type { CancellationToken, DefinitionLink, Position, TextDocument } from "vscode";

export class Model {
    constructor(
        public document: TextDocument,
        public position: Position,
        public word: string,
        public definition: DefinitionLink,
        public token: CancellationToken,
    ) { }

    public toString(): string {
        return `${this.document.uri} at ${this.position.line}:${this.position.character}`;
    }
}
