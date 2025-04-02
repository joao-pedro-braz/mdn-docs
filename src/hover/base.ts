import { commands, type CancellationToken, type DefinitionLink, type Hover, type HoverProvider, type OutputChannel, type Position, type TextDocument } from "vscode";
import type { MdnDocsLoader } from "../mdn";
import { Model } from "../model";
import type { TypescriptServer } from "../typescript";

export abstract class BaseHoverProvider implements HoverProvider {

  public abstract get name(): string;

  constructor(
    protected outputChannel: OutputChannel,
    protected typescriptServer: TypescriptServer,
    protected mdnDocsLoader: MdnDocsLoader
  ) {
    this.log("Provider Loaded");
  }

  protected abstract handles(model: Model): Thenable<boolean>;

  protected abstract createHoverContent(model: Model): Thenable<Hover | undefined>;

  async provideHover(document: TextDocument, position: Position, token: CancellationToken) {
    this.log(`Provider activated ${document.fileName} ${position.line} ${position.character} ${token}`);

    const wordRange = document.getWordRangeAtPosition(position);
    if (!wordRange) {
      this.log(`No word range found at position ${position.line}:${position.character}`);
      return undefined;
    }

    const word = document.getText(wordRange);
    if (!word) {
      this.log(`No word found at range ${wordRange}`);
      return undefined;
    }
    this.log(`Word found: '${word}'`);

    const definition = await this.getDefinition(document, position);
    if (!definition) {
      this.log(`No definition found for word '${word}'`);
      return undefined;
    }

    const model = new Model(document, position, word, definition, token);
    if (await this.handles(model)) {
      return this.createHoverContent(model);
    }

    return undefined;
  }

  protected async getDefinition(document: TextDocument, position: Position) {
    const result = await commands.executeCommand<DefinitionLink[]>(
      'vscode.executeDefinitionProvider',
      document.uri,
      position
    );

    if (Array.isArray(result) && result.length > 0) {
      return result[0];
    }

    return undefined;
  }

  protected log(content: string) {
    this.outputChannel.appendLine(`[${this.name}] ${content}`);
  }
}
