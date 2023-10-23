import { modifyCssFileForBackground } from "./modify";
import { showMessageWithConfirm, showProgress } from "../../utils/interactive";
import { createExParamPromise, delay } from "../../utils";
import { BackgroundConfiguration } from "../../workspace/background";
import { backgroundSendMessage } from "./executeWebview";
import { showMessageByModal, isWindowReloadToLoadBackimage, closeRandomBackground } from "./utils";
import { errlog, $rej } from "../../error";
import type { Progress } from "vscode";

type settingImageData = {
    code: string;
    index?: number;
};
/**
 * webview端点击图片设置背景图处理方法
 * @param options 传入点击图片的哈希码和在webview列表中的索引位置，如果是随机设置背景图则不需要传index
 * @param random 是否随机切换背景
 */
export function settingImage ({ code, index }: settingImageData, random: true): Promise<void>;
export function settingImage ({ code, index }: settingImageData, random?: false): void;
export function settingImage ({ code, index }: settingImageData, random: boolean = false) {
    if (random === true) {
        // 随机切换背景图在组件停止运行前进行，不进行弹框提示
        return setting(code, true);
    }
    // 如果不是随机切换背景图，则表示当前需要弹出提示
    showMessageByModal().then(() => {
        // 判断需要设置的图片哈希码是否和当前背景图哈希码不相同
        return Promise.resolve(code !== BackgroundConfiguration.getBackgroundNowImageCode);
    }).then(state => {
        if (state) {
            return Promise.resolve(settingProgress(code, index!));
        }
        showMessageWithConfirm('此图片当前已设置为背景图');
    }).catch((error) => {
        error && errlog(error);
    });
}

type TheProgress = Progress<{
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
function settimgCallback (code: string, index: number, progress: TheProgress) {
    return <Promise<void>> new Promise(resolve => {
        setting(code, false).then(() => {
            backgroundSendMessage({
                name: 'settingBackgroundSuccess',
                value: index!
            });
            progress.report({
                message: '设置成功',
                increment: 100
            });
            return delay(500);
        }).then(() => {
            isWindowReloadToLoadBackimage();
        }).finally(() => {
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
        modifyCssFileForBackground(code, random).then(() => {
            // 如果传入random参数为true，则不会关闭随机切换背景图状态
            if (!random && BackgroundConfiguration.getBackgroundIsRandom) {
                // 如果选中背景图设置则会关闭随机切换背景图
                return createExParamPromise(Promise.resolve(BackgroundConfiguration.setBackgroundIsRandom(false)), true);
            }
            return createExParamPromise(Promise.resolve(), false);
        }).then(([_, close]) => {
            if (close === true) {
                closeRandomBackground();
            }
            resolve();
        }).catch(err => {
            reject($rej(err, setting.name));
        });
    });
}