import * as vscode from 'vscode';
import { EXTENSION_NAME, ExtensionSetting, NAME } from './constants';
import { registerHoverProviders } from './hover';
import { CacheStorageService } from './cache';

const outputChannel = vscode.window.createOutputChannel(NAME);

export function activate(context: vscode.ExtensionContext) {
	// Check if the extension is enabled in the workspace
	const config = vscode.workspace.getConfiguration(EXTENSION_NAME);
	if (!config.get(ExtensionSetting.enabled, true)) 
		return;

	outputChannel.appendLine("MDN Docs extension activated");
	CacheStorageService.initialize(outputChannel, context);
	context.subscriptions.push(...registerHoverProviders(outputChannel));
}

export function deactivate() {
	outputChannel.appendLine("MDN Docs extension deactivated");
	outputChannel.dispose();
}
