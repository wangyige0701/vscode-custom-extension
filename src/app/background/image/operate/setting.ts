/** @fileoverview 设置背景图片方法  */

import type { Progress } from "vscode";
import { errlog } from "@/error";
import { createExParamPromise, delay } from "@/utils";
import { showMessageWithConfirm, showProgress } from "@/common/interactive";
import { closeRandomBackground } from "@background/common/func";
import { changeIsRandomState } from "@background/workspace/setter";
import { externalCssFileModify } from "@background/css/setter/external";
import { sendSettingImageCode } from "@background/webview/communication/send";
import { getNowIsSetRandom, getNowSettingCode } from "@background/workspace/getter";
import { isWindowReloadToLoadBackimage, showMessageByModal } from "@background/common/interactive";

type SettingImageDataType = {
    code: string;
    index?: number;
};

/**
 * webview端点击图片设置背景图处理方法
 * @param options 传入点击图片的哈希码和在webview列表中的索引位置，如果是随机设置背景图则不需要传index
 * @param random 是否随机切换背景
 */
export function settingImage ({ code, index }: SettingImageDataType, random: true): Promise<void>;
export function settingImage ({ code, index }: SettingImageDataType, random?: false): void;
export function settingImage ({ code, index }: SettingImageDataType, random: boolean = false) {
    if (random === true) {
        // 随机切换背景图在组件停止运行前进行，不进行弹框提示
        return setting(code, true);
    }
    // 如果不是随机切换背景图，则表示当前需要弹出提示
    showMessageByModal()
    .then(() => {
        // 判断需要设置的图片哈希码是否和当前背景图哈希码不相同
        if (code !== getNowSettingCode()) {
            return settingProgress(code, index!);
        }
    })
    .then(() => {
        showMessageWithConfirm('此图片当前已设置为背景图');
    })
    .catch(errlog);
}

type TheProgressType = Progress<{
    message?: string | undefined;
    increment?: number | undefined;
}>;

/** 执行设置背景图方法 */
function settingProgress (code: string, index: number) {
    return showProgress({
        location: 'Notification',
        title: '背景图设置中'
    }, settimgCallback.bind(null, code, index));
}

/** 进度条方法的回调函数 */
function settimgCallback (code: string, index: number, progress: TheProgressType) {
    return <Promise<void>> new Promise(resolve => {
        setting(code, false)
        .then(() => {
            sendSettingImageCode(index);
            progress.report({
                message: '设置成功',
                increment: 100
            });
            return delay(500);
        })
        .then(() => {
            isWindowReloadToLoadBackimage();
        })
        .finally(() => {
            resolve();
        });
    });
}

/**
 * 不同情况的判断
 * @param code
 * @param random
 * @returns
 */
function setting (code: string, random: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
        externalCssFileModify(code, random)
        .then(() => {
            // 如果传入random参数为true，则不会关闭随机切换背景图状态
            if (!random && getNowIsSetRandom()) {
                // 如果选中背景图设置则会关闭随机切换背景图
                return createExParamPromise(changeIsRandomState(false), true);
            }
            return createExParamPromise(Promise.resolve(), false);
        })
        .then(([_, close]) => {
            if (close === true) {
                closeRandomBackground();
            }
            resolve();
        })
        .catch(reject);
    });
}
