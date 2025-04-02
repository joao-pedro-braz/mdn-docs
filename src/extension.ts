import * as vscode from 'vscode';
import { NAME } from './constants';
import { registerHoverProviders } from './hover';
import { CacheStorageService } from './cache';

const outputChannel = vscode.window.createOutputChannel(NAME);

export function activate(context: vscode.ExtensionContext) {
	outputChannel.appendLine("MDN Docs extension activated");
	CacheStorageService.initialize(outputChannel, context);
	context.subscriptions.push(...registerHoverProviders(outputChannel));
}

export function deactivate() {
	outputChannel.appendLine("MDN Docs extension deactivated");
	outputChannel.dispose();
}
