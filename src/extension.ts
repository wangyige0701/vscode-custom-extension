import type { ExtensionContext } from 'vscode';
import { registBackground } from './app/background/regist';
import { checksumsInit } from './utils/checksums';
import { isNeedToCreateSharpBinaryFile } from "./library/create-sharp-node";
import { showTimeInStatusBar, stopTimeInStatusBar } from './time';
import ExtensionUri from './utils/system/extension';

export function activate(context: ExtensionContext) {
	// 将扩展uri赋值全局
	ExtensionUri.set(context.extensionUri);
	// 检测sharp二进制文件
	isNeedToCreateSharpBinaryFile(context);
	// 初始化校验和数据
	checksumsInit();
	// 注册背景图侧栏页面
	registBackground(context.subscriptions);
	// 打开时间显示
	showTimeInStatusBar(context.subscriptions);
}

// This method is called when your extension is deactivated
export function deactivate() {
	stopTimeInStatusBar();
	ExtensionUri.clear();
}