import type { Disposable, ExtensionContext } from "vscode";
import { commands } from "vscode";
import { windowInitCheckCssModifyCompleteness, clearBackgroundConfig, clearRepositoryWhenUninstall } from ".";
import { createExParamPromise, executeAllFunctions } from "../../utils";
import { setStatusBarResolve } from "../../common/interactive";
import { bindMessageCallback } from "../../common/webview";
import { registWebviewProvider } from "../../common/webview/provider";
import { resetBackgroundStorePath, selectFolderForBackgroundStore } from "./selectStore";
import { BackgroundConfiguration, defaultPath } from "../../workspace/background";
import { setRandomBackground } from "./modifyRandom";
import { backgroundWebviewCommunication } from "./webview/communication";
import { copyFileWhenVersionChange } from "../../version";
import { errlog, $rej } from "../../error";
import { clearDynamicImport } from "../../library";

/** 注册背景图设置功能 */
export function registBackground (subscriptions: ExtensionContext["subscriptions"]): void {
	const statusBarTarget: Disposable = setStatusBarResolve({
		icon: 'loading~spin',
		message: '默认路径图片数据检测'
	});
	copyFileWhenVersionChange(defaultPath.join('/')).then(() => {
		statusBarTarget?.dispose();
		// 检测是否需要更新缓存图片码
		return checkRandomCode();
	}).then(state => {
		// 检测配置完整
		return createExParamPromise(windowInitCheckCssModifyCompleteness(), state);
	}).then(([_, state]) => {
		// 开启后判断是否随机修改背景
		if (state) {
			return setRandomBackground();
		}
	}).then(() => {
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
	}).catch(err => {
		errlog(err);
	}).finally(() => {
		statusBarTarget?.dispose();
	});
}

/** webview切换隐藏时，触发的销毁数据函数 */
function executeWhenUninstall () {
	executeAllFunctions(
		clearRepositoryWhenUninstall,
		clearDynamicImport
	);
}

/** 检测当前状态是否为背景随机切换，是则更新随机图片缓存到当前图片缓存中 */
function checkRandomCode (): Promise<boolean> {
	return new Promise((resolve, reject) => {
		if (!BackgroundConfiguration.getBackgroundIsRandom) {
			return resolve(false);
		}
		// 当状态为随机切换时，更新当前选择图片数据
		const code = BackgroundConfiguration.getBackgroundRandomCode;
		if (!code) {
			return resolve(false);
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
			reject($rej(err, checkRandomCode.name));
		});
	});
}