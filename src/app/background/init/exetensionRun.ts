/** @description 插件首次加载 */

import type { Disposable } from "vscode";
import { isBackgroundCheckComplete } from "./data";
import { isWindowReloadToLoadBackimage } from "../utils";
import { errlog } from "../../../error";
import { setStatusBarResolve } from "../../../common/interactive";
import { BackgroundConfiguration } from "../../../workspace";

/** vscode初始化后检测背景配置是否完整 */
export async function windowInitCheckCssModifyCompleteness () {
    // 检查css文件是否正确
	await checkImageCssDataIsRight().then(state => {
		if (state) {
            // 需要重启应用背景
			isWindowReloadToLoadBackimage('检测到背景图配置修改或删除，当前状态可能为插件重装，如果需要重新应用背景请选择确认重启窗口');
        }
	}).catch(err => {
		errlog(err);
	});
    return Promise.resolve();
}

/**
 * vscode开始运行后插件启动时调用，
 * 校验外部css文件和源css文件是否删除背景图相关配置内容，
 * 返回true代表其中一个文件被修改或删除，需要重启窗口应用样式
 */
export function checkImageCssDataIsRight (): Promise<boolean> {
    return new Promise((resolve, reject) => {
        isBackgroundCheckComplete.check = true;
        const statusBarTarget: Disposable = setStatusBarResolve({
            icon: 'loading~spin',
            message: '背景图文件校验中'
        });
        Promise.resolve(<Promise<void>>new Promise(($resolve, $reject) => {
            const isBack = BackgroundConfiguration.getBackgroundIsSetBackground;
            if (!isBack) {
                // 当前没有设置背景图，则直接跳出检测
                return $reject({ jump: true, data: false });
            }
            // promise完成
            $resolve();
        })).then(() => {
            // 设置了背景图则校验源文件是否写入了背景图导入语句
            return setSourceCssImportInfo(true);
        }).then((res) => {
            return createExParamPromise(checkExternalDataIsRight(), false || res.modify);
        }).then(([res, state]) => {
            state = state || res.modify;
            // 更新load加载状态缓存信息，state为false即不需要重启窗口应用背景时更新
            if (!state) {
                changeLoadState();
            }
            resolve(state);
        }).catch(err => {
            if (err.jump) {
                return resolve(err.data);
            }
            reject($rej(err, checkImageCssDataIsRight.name));
        }).finally(() => {
            statusBarTarget?.dispose();
            // 状态栏提示信息
            setBackgroundImageSuccess('背景图文件校验完成');
            isBackgroundCheckComplete.check = false;
            executeInitFunc();
        });
    });
}

/** 根据对象判断是否需要再次执行初始化函数 */
function executeInitFunc () {
    if (isBackgroundCheckComplete.init) {
        backgroundImageDataInit();
    }
}