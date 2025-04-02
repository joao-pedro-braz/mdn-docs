import type { server, QuickInfo } from "typescript";
import { commands, type OutputChannel } from "vscode";
import type { Model } from "./model";

export class TypescriptServer {
    constructor(private outputChannel: OutputChannel) { }

    async quickInfo(
        model: Model
    ): Promise<QuickInfo | undefined> {
        this.log(`Requesting quick info for ${model.document.uri} at ${model.position.line}:${model.position.character}`);

        return await commands.executeCommand<server.protocol.QuickInfoResponse>(
            "typescript.tsserverRequest",
            'quickinfo-full',
            {
                file: model.document.uri as any,
                line: model.position.line + 1,
                offset: model.position.character + 1,
            } satisfies server.protocol.FileLocationRequestArgs
        ).then(response => response?.body ? response.body as unknown as QuickInfo : undefined);
    }

    private log(content: string) {
        this.outputChannel.appendLine(`[TypescriptServer] ${content}`);
    }
}
