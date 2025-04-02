import type { server } from "typescript";
import { type Position, type TextDocument, commands } from "vscode";

export async function getTypeScriptQuickInfo(
    document: TextDocument,
    position: Position
): Promise<server.protocol.QuickInfoResponse | undefined> {
    return await commands.executeCommand<server.protocol.QuickInfoResponse>(
        "typescript.tsserverRequest",
        'quickinfo-full',
        {
            file: document.uri as any,
            line: position.line + 1,
            offset: position.character + 1,
        } satisfies server.protocol.FileLocationRequestArgs
    );
}
