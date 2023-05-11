import * as vscode from 'vscode';
import { webviewCreateByHtml, contextContainer, registWebview } from './utils/webview';
import { getVersion } from './version';

export function activate(context: vscode.ExtensionContext) {
	contextContainer.instance = context;

	const backgroundWebview = registWebview('wangyige.custom.backgroundimage', new webviewCreateByHtml('src/webview/barview', '背景图片'));

	context.subscriptions.push(backgroundWebview);

	console.log(getVersion());
	
}

// This method is called when your extension is deactivated
export function deactivate() {}