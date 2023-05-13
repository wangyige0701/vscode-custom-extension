import * as vscode from 'vscode';
import { webviewCreateByHtml, contextContainer as webviewContextContainer, registWebview } from './utils/webview';
import { WindowInitCheckCssModifyCompleteness } from './backgroundImage';

export function activate(context: vscode.ExtensionContext) {
	// 检测配置完整
	WindowInitCheckCssModifyCompleteness();
	
	webviewContextContainer.instance = context;

	// 设置背景图的侧栏webview注册
	const backgroundWebview = registWebview('wangyige.custom.backgroundimage', new webviewCreateByHtml('src/webview/background', '背景图片'));

	context.subscriptions.push(backgroundWebview);
}

// This method is called when your extension is deactivated
export function deactivate() { }