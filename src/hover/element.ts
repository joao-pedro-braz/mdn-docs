import { Hover, languages, type OutputChannel } from "vscode";
import { CacheStorageService } from "../cache";
import { DOCUMENT_SELECTORS } from "../constants";
import { MdnDocsLoader } from "../mdn";
import type { Model } from "../model";
import { TypescriptServer } from "../typescript";
import { BaseHoverProvider } from "./base";

export class JsxElementAttributeHoverProvider extends BaseHoverProvider {
    public get name(): string {
        return "JsxElementAttributeHoverProvider";
    }

    protected async handles(model: Model) {
        const quickInfo = await this.typescriptServer.quickInfo(model);
        if (!quickInfo || !quickInfo.displayParts) {
            this.log(`No quick info for ${model.toString()}`);
            return false;
        }

        this.log(JSON.stringify(quickInfo.displayParts));
        const jsxPartIndex = quickInfo.displayParts.findIndex(part => part.text.match(/^.*HTMLAttributes$/) && part.kind === 'interfaceName');
        if (jsxPartIndex === -1) {
            this.log(`Not a JSX attribute for ${model.toString()}`);
            return false;
        }

        this.log(`Found JSX attribute for ${model.toString()}`);
        return true;
    }

    protected async createHoverContent(model: Model) {
        const docs = await this.mdnDocsLoader.fetchElementAttribute(model.word);
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
        new JsxElementAttributeHoverProvider(
            outputChannel,
            new TypescriptServer(outputChannel),
            new MdnDocsLoader(outputChannel, CacheStorageService.getInstance())
        )
    );
}
