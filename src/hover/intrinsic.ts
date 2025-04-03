import { Hover, languages, type OutputChannel } from "vscode";
import { DOCUMENT_SELECTORS } from "../constants";
import type { Model } from '../model';
import { TypescriptServer } from '../typescript';
import { BaseHoverProvider } from "./base";
import { MdnDocsLoader } from "../mdn";
import { CacheStorageService } from "../cache";
import { NodeManipulator } from "../node";
import { BrowserCompatDataLoader } from "../browser";

export class JsxIntrinsicElementHoverProvider extends BaseHoverProvider {
    public get name(): string {
        return "JsxIntrinsicElementsHoverProvider";
    }

    protected async handles(model: Model): Promise<boolean> {
        const quickInfo = await this.typescriptServer.quickInfo(model);
        if (!quickInfo || !quickInfo.displayParts) {
            this.log(`No quick info for ${model.toString()}`);
            return false;
        }

        const jsxPartIndex = quickInfo.displayParts.findIndex(part => part.text === 'JSX' && part.kind === 'moduleName');
        if (jsxPartIndex === -1) {
            this.log(`Not a JSX element for ${model.toString()}`);
            return false;
        }

        const isIntrinsicElement = quickInfo.displayParts.slice(jsxPartIndex).some(part => part.text === 'IntrinsicElements' && part.kind === 'interfaceName');
        if (!isIntrinsicElement) {
            this.log(`Not an IntrinsicElements for ${model.toString()}`);
            return false;
        }

        this.log(`Found JSX IntrinsicElements for ${model.toString()}`);
        return true;
    }

    protected async createHoverContent(
        model: Model
    ) {
        const docs = await this.mdnDocsLoader.fetchHtmlElement(model.word);
        if (!docs) {
            this.log(`No documentation found for ${model.word}`);
            return undefined;
        }
    
        const hoverContent = new Hover(docs);
        this.log(`Created hover content for ${model.word}`);
        return hoverContent;
    }

}

export function register(outputChannel: OutputChannel) {
    return languages.registerHoverProvider(
        DOCUMENT_SELECTORS,
        new JsxIntrinsicElementHoverProvider(
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
