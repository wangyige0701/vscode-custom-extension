/** @fileoverview 扩展开始运行后配置检测 */

import type { Disposable } from "vscode";
import { initStatusHandle } from "../../data/initStatus";
import { setStatusBarResolve } from "../../../../common/interactive";
import { createExParamPromise } from "../../../../utils";
import { setSourceCssImportInfo } from "../../css/setter/source";
import { checkExternalDataIsRight } from "../css/external";
import { getNowIsSetBackground } from "../../workspace/getter";
import { changeLoadStateToTrue } from "../../workspace/setter";
import { $rej } from "../../../../error";
import { setBackgroundImageSuccess } from "../../common/interactive";
import { backgroundImageDataInit } from "../webview/load";

/**
 * vscode开始运行后插件启动时调用，
 * 校验外部css文件和源css文件是否删除背景图相关配置内容，
 * 返回true代表其中一个文件被修改或删除，需要重启窗口应用样式
 */
export async function checkImageCssDataIsRight (): Promise<boolean> {
    return new Promise((resolve, reject) => {
        const statusBarTarget = createStatusBar();
        if (statusBarTarget === false) {
            return resolve(statusBarTarget);
        }
        // 设置了背景图则校验源文件是否写入了背景图导入语句
        setSourceCssImportInfo(true)
        .then((res) => {
            return createExParamPromise(checkExternalDataIsRight(), false || res.modify);
        })
        .then(async ([res, state]) => {
            const needReload = state || res.modify;
            // 更新load加载状态缓存信息，state为false即不需要重启窗口应用背景时更新
            if (!needReload) {
                await changeLoadStateToTrue();
            }
            resolve(needReload);
        })
        .catch(err => {
            reject($rej(err, checkImageCssDataIsRight.name));
        })
        .finally(() => {
            statusBarTarget?.dispose();
            // 状态栏提示信息
            setBackgroundImageSuccess('背景图文件校验完成');
            initStatusHandle.offCheck();
            // 根据对象判断是否需要再次执行初始化函数
            if (initStatusHandle.init) {
                backgroundImageDataInit();
            }
        });
    });
}

/** 打开状态栏信息 */
function createStatusBar () {
    initStatusHandle.onCheck();
    const statusBarTarget: Disposable = setStatusBarResolve({
        icon: 'loading~spin',
        message: '背景图文件校验中'
    });
    const isBack = getNowIsSetBackground();
    if (!isBack) {
        // 当前没有设置背景图，则直接跳出检测
        return false;
    }
    return statusBarTarget;
}