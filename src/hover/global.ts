import { Hover, languages, type OutputChannel } from "vscode";
import { CacheStorageService } from "../cache";
import { DOCUMENT_SELECTORS } from "../constants";
import { MdnDocsLoader } from "../mdn";
import type { Model } from "../model";
import { TypescriptServer } from "../typescript";
import { BaseHoverProvider } from "./base";
import { NodeManipulator } from "../node";
import { BrowserCompatDataLoader } from "../browser";

export class JsxGlobalAttributeHoverProvider extends BaseHoverProvider {
    public get name(): string {
        return "JsxGlobalAttributeHoverProvider";
    }

    protected async handles(model: Model) {
        const quickInfo = await this.typescriptServer.quickInfo(model);
        if (!quickInfo || !quickInfo.displayParts) {
            this.log(`No quick info for ${model.toString()}`);
            return false;
        }

        const jsxPartIndex = quickInfo.displayParts.findIndex(part => part.text === 'HTMLAttributes' && part.kind === 'interfaceName');
        if (jsxPartIndex === -1) {
            this.log(`Not a JSX attribute for ${model.toString()}`);
            return false;
        }

        this.log(`Found JSX attribute for ${model.toString()}`);

        if (model.word === 'className') {
            this.log(`HACK: Transformed className into class`);
            model.word = 'class';
        }

        return true;
    }

    protected async createHoverContent(model: Model) {
        const docs = await this.mdnDocsLoader.fetchGlobalAttribute(model.word);
        if (!docs) {
            this.log(`No documentation found for ${model.word}`);
            return undefined;
        }

        this.log(`Created hover content for ${model.word}`);
        return new Hover(docs);
    }

}

export function register(outputChannel: OutputChannel) {
    return languages.registerHoverProvider(
        DOCUMENT_SELECTORS,
        new JsxGlobalAttributeHoverProvider(
            outputChannel,
            new TypescriptServer(outputChannel),
            new MdnDocsLoader(
                outputChannel,
                new NodeManipulator(outputChannel),
                new BrowserCompatDataLoader(outputChannel),
                CacheStorageService.getInstance()
            )
        )
    );
}
