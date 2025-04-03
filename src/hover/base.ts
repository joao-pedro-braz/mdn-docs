import { type CancellationToken, type Hover, type HoverProvider, type OutputChannel, type Position, type TextDocument } from "vscode";
import type { MdnDocsLoader } from "../mdn";
import { Model } from "../model";
import type { TypescriptServer } from "../typescript";

export abstract class BaseHoverProvider implements HoverProvider {
  /**
   * Gets the unique name identifier for this hover provider.
   * 
   * This abstract property must be implemented by derived classes to provide
   * a descriptive name for the hover provider. The name is used in logging
   * and potentially for provider identification throughout the extension.
   * 
   * @returns A string representing the name of the hover provider
   */
  public abstract get name(): string;

  constructor(
    protected outputChannel: OutputChannel,
    protected typescriptServer: TypescriptServer,
    protected mdnDocsLoader: MdnDocsLoader
  ) {
    this.log("Provider Loaded");
  }


  /**
   * Determines whether this hover provider can handle the specified model.
   * 
   * This method should be implemented by derived classes to check if the provider
   * can process and provide hover information for the given model context.
   * 
   * @param model - The model containing document, position, word, and definition information
   * @returns A promise resolving to a boolean indicating whether this provider can handle the model
   */
  protected abstract handles(model: Model): Thenable<boolean>;

  /**
   * Creates the hover content for a specific model when this provider can handle it.
   * 
   * This method is called by the `provideHover` method after determining that
   * this provider can handle the model through the `handles` method.
   * It should generate appropriate hover content based on the model information.
   * 
   * @param model - The model containing document, position, word, and definition information
   * @returns A promise resolving to a Hover object with the content or undefined if no hover can be created
   */
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

    const model = new Model(document, position, word, token);
    if (await this.handles(model)) {
      return this.createHoverContent(model);
    }

    return undefined;
  }

  /**
   * Logs a message to the output channel with the provider's name as a prefix.
   * 
   * @param content - The message to be logged
   */
  protected log(content: string) {
    this.outputChannel.appendLine(`[${this.name}] ${content}`);
  }
}
