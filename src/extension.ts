import type { ExtensionContext } from 'vscode';
import { registBackground } from './background/regist';
import { contextContainer } from './utils/webview/index';

export function activate(context: ExtensionContext) {
	contextContainer.instance = context;

	// 注册背景图侧栏页面
	registBackground();
}

// This method is called when your extension is deactivated
export function deactivate() {
	contextContainer.instance = undefined;
}