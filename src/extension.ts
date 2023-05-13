import * as vscode from 'vscode';
import { webviewCreateByHtml, contextContainer as webviewContextContainer, registWebview } from './utils/webview';
import { checkImageCssDataIsRight } from './backgroundImage';
import { isWindowReloadToLoadBackimage } from './backgroundImage/utils';
import { errHandle } from './error';

export function activate(context: vscode.ExtensionContext) {
	// 检查css文件是否正确
	checkImageCssDataIsRight().then(state => {
		if (state) {
			// 需要重启应用背景
			isWindowReloadToLoadBackimage('背景图设置文件被修改或删除，需要重启窗口以应用背景');
		}
	}).catch(err => {
		errHandle(err);
	});
	
	webviewContextContainer.instance = context;

	// 设置背景图的侧栏webview注册
	const backgroundWebview = registWebview('wangyige.custom.backgroundimage', new webviewCreateByHtml('src/webview/background', '背景图片'));

	context.subscriptions.push(backgroundWebview);
}

// This method is called when your extension is deactivated
export function deactivate() { }