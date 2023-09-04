import type { ExtensionContext } from 'vscode';
import { registBackground } from './background/regist';
import { contextContainer } from './utils/webview/index';
import { checksumsInit } from './utils/checksums';

export function activate(context: ExtensionContext) {
	contextContainer.instance = context;

	// 注册背景图侧栏页面
	registBackground();

	checksumsInit();
}

// This method is called when your extension is deactivated
export function deactivate() {
	contextContainer.instance = undefined;
}