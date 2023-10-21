import type { ExtensionContext } from 'vscode';
import { registBackground } from './app/background/regist';
import { contextContainer } from './utils/webview/index';
import { checksumsInit } from './utils/checksums';
import { isNeedToCreateSharpBinaryFile } from "./library/create-sharp-node";
import { showTimeInStatusBar } from './time/indx';

export function activate(context: ExtensionContext) {
	// webview模块内扩展上下文实例赋值
	contextContainer.instance = context;
	// 检测sharp二进制文件
	isNeedToCreateSharpBinaryFile(context);
	// 初始化校验和数据
	checksumsInit();
	// 注册背景图侧栏页面
	registBackground();

	showTimeInStatusBar(context);
}

// This method is called when your extension is deactivated
export function deactivate() {
	contextContainer.instance = void 0;
}