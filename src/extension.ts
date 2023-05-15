import * as vscode from 'vscode';
import { registBackground } from './backgroundImage/regist';

export function activate(context: vscode.ExtensionContext) {
	// 注册背景图侧栏页面
	registBackground(context);
}

// This method is called when your extension is deactivated
export function deactivate() { }