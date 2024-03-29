/** @description 注册背景图webview页面 */

import type { Disposable, ExtensionContext } from "vscode";
import { commands } from "vscode";
import { errlog } from "../../error";
import { createExParamPromise, executeAllFunctions } from "../../utils";
import { setStatusBarResolve } from "../../common/interactive";
import { bindMessageCallback } from "../../common/webview";
import { registWebviewProvider } from "../../common/webview/provider";
import { copyFileWhenVersionChange } from "../../version";
import { clearDynamicImport } from "../../library";
import { windowInitCheckCssModifyCompleteness } from "./check/extension/init";
import { selectFolderForBackgroundStore, resetBackgroundStorePath } from "./common/interactive";
import { clearBackgroundConfig } from "./data-operate/clearConfig";
import { backgroundWebviewCommunication } from "./webview/communication/receive";
import { setRandomBackground } from "./webview/random/setter";
import { hashCodeCache } from "./data/hashCodeCache";
import { imageDataCache } from "./data/imageCache";
import { settingNowImageCode, settingRandomCode } from "./workspace/setter";
import { getBackgroundResourcePath, getNowIsSetRandom, getNowRandomCode } from "./workspace/getter";

/** 注册背景图设置功能 */
export function registBackground (subscriptions: ExtensionContext["subscriptions"]): void {
	const statusBarTarget: Disposable = setStatusBarResolve({
		icon: 'loading~spin',
		message: '默认路径图片数据检测'
	});
	copyFileWhenVersionChange(getBackgroundResourcePath().join('/'))
	.then(() => {
		statusBarTarget?.dispose();
		// 检测是否需要更新缓存图片码
		return checkRandomCode();
	})
	.then(state => {
		// 检测配置完整
		return createExParamPromise(windowInitCheckCssModifyCompleteness(), state);
	})
	.then(([_, state]) => {
		// 开启后判断是否随机修改背景
		if (state) {
			return setRandomBackground();
		}
	})
	.then(() => {
		// 设置背景图的侧栏webview注册
		registWebviewProvider(
			subscriptions,
			'wangyige.custom.backgroundImage', 
			{ path: 'webview/src/background', title: '背景图片' }, 
			{ visibleHiddenCallback: executeWhenUninstall }
		);
		// 命令事件注册
		commands.registerCommand('wangyige.background.selectStore', selectFolderForBackgroundStore);
		commands.registerCommand('wangyige.background.resetStore', resetBackgroundStorePath);
		commands.registerCommand('wangyige.background.clear', clearBackgroundConfig);
		// 绑定事件通信回调
		bindMessageCallback('onBackground', backgroundWebviewCommunication);
	})
	.catch(errlog)
	.finally(() => {
		statusBarTarget?.dispose();
	});
}

/** webview切换隐藏时，触发的销毁数据函数 */
function executeWhenUninstall () {
	executeAllFunctions(
		imageDataCache.clear,
		hashCodeCache.clear,
		clearDynamicImport
	);
}

/** 检测当前状态是否为背景随机切换，是则更新随机图片缓存到当前图片缓存中 */
function checkRandomCode (): Promise<boolean> {
	return new Promise((resolve, reject) => {
		if (!getNowIsSetRandom()) {
			return resolve(false);
		}
		// 当状态为随机切换时，更新当前选择图片数据
		const code = getNowRandomCode();
		if (!code) {
			return resolve(false);
		}
		settingNowImageCode(code)
		.then(() => {
			return settingRandomCode('');
		})
		.then(() => {
			resolve(true);
		})
		.catch(reject);
	});
}