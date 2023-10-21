import type { ExtensionContext } from 'vscode';
import { registBackground } from './app/background/regist';
import { contextContainer } from './utils/webview/index';
import { checksumsInit } from './utils/checksums';
import { isNeedToCreateSharpBinaryFile } from "./library/create-sharp-node";
import { showTimeInStatusBar, stopTimeInStatusBar } from './time';

export function activate(context: ExtensionContext) {
	// webview模块内扩展上下文实例赋值
	contextContainer.instance = context;
	// 检测sharp二进制文件
	isNeedToCreateSharpBinaryFile(context);
	// 初始化校验和数据
	checksumsInit();
	// 注册背景图侧栏页面
	registBackground();
	// 打开时间显示
	showTimeInStatusBar(context);
}

// This method is called when your extension is deactivated
export function deactivate() {
	stopTimeInStatusBar();
	contextContainer.instance = void 0;
}