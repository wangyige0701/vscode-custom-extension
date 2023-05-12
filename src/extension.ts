import * as vscode from 'vscode';
import { webviewCreateByHtml, contextContainer as webviewContextContainer, registWebview } from './utils/webview';
import { setMessage } from './utils/interactive';

export function activate(context: vscode.ExtensionContext) {
	webviewContextContainer.instance = context;

	// 设置背景图的侧栏webview注册
	const backgroundWebview = registWebview('wangyige.custom.backgroundimage', new webviewCreateByHtml('src/webview/barview', '背景图片'));

	context.subscriptions.push(backgroundWebview);

	// vscode.window.setStatusBarMessage('aaaaa')
}

// This method is called when your extension is deactivated
export function deactivate() {}