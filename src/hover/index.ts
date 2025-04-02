import type { OutputChannel } from "vscode";
import { register as registerIntrinsic } from "./intrinsic";
import { register as registerGlobalAttribute } from "./global";
import { register as registerElementAttribute } from "./element";

export function registerHoverProviders(outputChannel: OutputChannel) {
    return [
        registerIntrinsic(outputChannel),
        registerGlobalAttribute(outputChannel),
        registerElementAttribute(outputChannel),
    ];
}
