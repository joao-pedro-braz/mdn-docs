import { Hover, languages, type OutputChannel } from "vscode";
import { CacheStorageService } from "../cache";
import { DOCUMENT_SELECTORS } from "../constants";
import { MdnDocsLoader } from "../mdn";
import type { Model } from "../model";
import { TypescriptServer } from "../typescript";
import { BaseHoverProvider } from "./base";
import { NodeManipulator } from "../node";
import { BrowserCompatDataLoader } from "../browser";
import type { QuickInfo } from "typescript";

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

        const jsxPartIndex = quickInfo.displayParts.findIndex(part => part.text.match(/^.*HTMLAttributes$/) && part.kind === 'interfaceName');
        if (jsxPartIndex === -1) {
            this.log(`Not a JSX attribute for ${model.toString()}`);
            return false;
        }

        this.log(`Found JSX attribute for ${model.toString()}`);

        const tagName = this.determineTagName(quickInfo);
        if (tagName) {
            model.meta = { ...model.meta, tagName };
        }

        return true;
    }

    protected async createHoverContent(model: Model) {
        const docs = await this.mdnDocsLoader.fetchElementAttribute(
            model.word,
            model.meta['tagName'] as string | undefined
        );
        if (!docs) {
            this.log(`No documentation found for ${model.word}`);
            return undefined;
        }

        const hoverContent = new Hover(docs);
        this.log(`Created hover content for ${model.word}`);
        return hoverContent;
    }

    private determineTagName(quickInfo: QuickInfo) {
        const interfaceName = quickInfo.displayParts?.find(part => part.kind === 'interfaceName');
        if (!interfaceName) {
            return undefined;
        }

        return interfaceName.text.endsWith("HTMLAttributes")
            ? interfaceName.text.split("HTMLAttributes")[0]
            : undefined;
    }

}

export function register(outputChannel: OutputChannel) {
    return languages.registerHoverProvider(
        DOCUMENT_SELECTORS,
        new JsxElementAttributeHoverProvider(
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
