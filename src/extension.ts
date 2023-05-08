import * as vscode from 'vscode';
import { webviewCreateByHtml, contextContainer, registWebview } from './utils/webview';

export function activate(context: vscode.ExtensionContext) {
	contextContainer.instance = context;

	const backgroundWebview = registWebview('wangyige.custom.backgroundimage', new webviewCreateByHtml('src/webview/barview'));

	context.subscriptions.push(backgroundWebview);
}

// This method is called when your extension is deactivated
export function deactivate() {}