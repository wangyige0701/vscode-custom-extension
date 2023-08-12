import { Disposable, commands } from "vscode";
import { WindowInitCheckCssModifyCompleteness, clearBackgroundConfig } from ".";
import { registWebviewProvider } from "../utils/webview/provider";
import { resetBackgroundStorePath, selectFolderForBackgroundStore } from "./selectStore";
import { backgroundImageConfiguration } from "../workspace/background";
import { setRandomBackground } from "./modifyRandom";
import { bindMessageCallback } from "../utils/webview/message";
import { backgroundExecute } from "./execute";
import { copyFileWhenVersionChange } from "../version/versionChange";
import { setStatusBarResolve } from "../utils/interactive";
import { errHandle } from "../error";

/**
 * 注册背景图设置功能
 */
export function registBackground () {
	let statusBarTarget: Disposable | null = setStatusBarResolve({
		icon: 'loading~spin',
		message: '默认路径图片数据确认'
	});
	copyFileWhenVersionChange('resources/background').then(() => {
		statusBarTarget?.dispose();
		// 检测是否需要更新缓存图片码
		return checkRandomCode();
	}).then(() => {
		// 检测配置完整
		return WindowInitCheckCssModifyCompleteness();
	}).then(() => {
		// 开启后判断是否随机修改背景
		setRandomBackground();
		// 设置背景图的侧栏webview注册
		registWebviewProvider('wangyige.custom.backgroundImage', { path: 'webview/src/background', title: '背景图片' });
		// 命令事件注册
		commands.registerCommand('wangyige.background.selectStore', selectFolderForBackgroundStore);
		commands.registerCommand('wangyige.background.resetStore', resetBackgroundStorePath);
		commands.registerCommand('wangyige.background.clear', clearBackgroundConfig);

		// 绑定事件通信回调
		bindMessageCallback('onBackground', backgroundExecute);
	}).catch(err => {
		errHandle(err);
	}).finally(() => {
		statusBarTarget?.dispose();
		statusBarTarget = null;
	});
}

/**
 * 检测当前状态是否为背景随机切换，是则更新随机图片缓存到当前图片缓存中
 * @returns 
 */
function checkRandomCode (): Promise<void> {
	return new Promise((resolve, reject) => {
		try {
			if (backgroundImageConfiguration.getBackgroundIsRandom()) {
				// 当状态为随机切换时，根棍当前选择图片数据
				const code = backgroundImageConfiguration.getBackgroundRandomCode();
				if (!code) {
					resolve();
					return;
				}
				Promise.resolve(
					backgroundImageConfiguration.setBackgroundNowImagePath(code)
				).then(() => {
					return Promise.resolve(backgroundImageConfiguration.setBackgroundRandomCode(''));
				}).then(() => {
					resolve();
				}).catch(err => {
					reject(err);
				});
			} else {
				resolve();
			}
		} catch (error) {
			reject(error);
		}
	});
}