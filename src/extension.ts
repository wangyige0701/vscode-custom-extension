import * as vscode from 'vscode';
import { registBackground } from './backgroundImage/regist';
import { contextContainer } from './utils/webview/index';

export function activate(context: vscode.ExtensionContext) {
	contextContainer.instance = context;

	// 注册背景图侧栏页面
	registBackground();
}

// This method is called when your extension is deactivated
export function deactivate() { }