import { Disposable, commands } from "vscode";
import { WindowInitCheckCssModifyCompleteness, clearBackgroundConfig } from ".";
import { registWebviewProvider } from "../../utils/webview/provider";
import { resetBackgroundStorePath, selectFolderForBackgroundStore } from "./selectStore";
import { BackgroundConfiguration } from "../../workspace/background";
import { setRandomBackground } from "./modifyRandom";
import { bindMessageCallback } from "../../utils/webview/message";
import { backgroundExecute } from "./execute";
import { copyFileWhenVersionChange } from "../../version/versionChange";
import { setStatusBarResolve } from "../../utils/interactive";
import { errlog, promiseReject } from "../../error";
import { createExParamPromise } from "../../utils";

/** 注册背景图设置功能 */
export function registBackground (): void {
	let statusBarTarget: Disposable | null = setStatusBarResolve({
		icon: 'loading~spin',
		message: '默认路径图片数据确认'
	});
	copyFileWhenVersionChange('resources/background').then(() => {
		statusBarTarget?.dispose();
		// 检测是否需要更新缓存图片码
		return checkRandomCode();
	}).then(state => {
		// 检测配置完整
		return createExParamPromise(WindowInitCheckCssModifyCompleteness(), state);
	}).then(([_, state]) => {
		// 开启后判断是否随机修改背景
		if (state) {
			return setRandomBackground();
		}
	}).then(() => {
		// 设置背景图的侧栏webview注册
		registWebviewProvider('wangyige.custom.backgroundImage', { path: 'webview/src/background', title: '背景图片' });
		// 命令事件注册
		commands.registerCommand('wangyige.background.selectStore', selectFolderForBackgroundStore);
		commands.registerCommand('wangyige.background.resetStore', resetBackgroundStorePath);
		commands.registerCommand('wangyige.background.clear', clearBackgroundConfig);
		// 绑定事件通信回调
		bindMessageCallback('onBackground', backgroundExecute);
	}).catch(err => {
		errlog(err);
	}).finally(() => {
		statusBarTarget?.dispose();
		statusBarTarget = null;
	});
}

/** 检测当前状态是否为背景随机切换，是则更新随机图片缓存到当前图片缓存中 */
function checkRandomCode (): Promise<boolean> {
	return new Promise((resolve, reject) => {
		if (!BackgroundConfiguration.getBackgroundIsRandom) {
			resolve(false);
			return;
		}
		// 当状态为随机切换时，更新当前选择图片数据
		const code = BackgroundConfiguration.getBackgroundRandomCode;
		if (!code) {
			resolve(false);
			return;
		}
		Promise.resolve(
			BackgroundConfiguration.setBackgroundNowImageCode(code)
		).then(() => {
			return Promise.resolve(
				BackgroundConfiguration.setBackgroundRandomCode('')
			);
		}).then(() => {
			resolve(true);
		}).catch(err => {
			reject(promiseReject(err, 'checkRandomCode'));
		});
	});
}