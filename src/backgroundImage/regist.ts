import { ExtensionContext, commands } from "vscode";
import { WindowInitCheckCssModifyCompleteness } from ".";
import { contextContainer, registWebview, webviewCreateByHtml } from "../utils/webview";
import { resetBackgroundStorePath, selectFolderForBackgroundStore } from "./selectStore";

/**
 * 注册背景图设置功能
 * @param context 
 */
export function registBackground (context: ExtensionContext) {
    // 检测配置完整
	WindowInitCheckCssModifyCompleteness();
	
	contextContainer.instance = context;

	// 设置背景图的侧栏webview注册
	const backgroundWebview = registWebview('wangyige.custom.backgroundimage', new webviewCreateByHtml('src/webview/background', '背景图片'));
	context.subscriptions.push(backgroundWebview);

	commands.registerCommand('wangyige.background.selectStore', selectFolderForBackgroundStore);
	commands.registerCommand('wangyige.background.resetStore', resetBackgroundStorePath);
}