import { ExtensionContext, commands } from "vscode";
import { WindowInitCheckCssModifyCompleteness, clearBackgroundConfig } from ".";
import { contextContainer, registWebview, webviewCreateByHtml } from "../utils/webview";
import { resetBackgroundStorePath, selectFolderForBackgroundStore } from "./selectStore";
import { setRandomBackground } from "./modifyRandom";

/**
 * 注册背景图设置功能
 * @param context 
 */
export function registBackground (context: ExtensionContext) {
	contextContainer.instance = context;
    // 检测配置完整
	WindowInitCheckCssModifyCompleteness().then(() => {
		// 开启后判断是否随机修改背景
		setRandomBackground();
	});

	// 设置背景图的侧栏webview注册
	const backgroundWebview = registWebview('wangyige.custom.backgroundImage', new webviewCreateByHtml('webview/background', '背景图片'));
	context.subscriptions.push(backgroundWebview);

	// 命令事件注册
	commands.registerCommand('wangyige.background.selectStore', selectFolderForBackgroundStore);
	commands.registerCommand('wangyige.background.resetStore', resetBackgroundStorePath);
	commands.registerCommand('wangyige.background.clear', clearBackgroundConfig);
}