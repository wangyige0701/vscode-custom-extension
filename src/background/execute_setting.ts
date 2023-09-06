import { modifyCssFileForBackground } from "./modify";
import { showMessage, showProgress } from "../utils/interactive";
import { delay } from "../utils";
import { backgroundImageConfiguration } from "../workspace/background";
import { backgroundSendMessage } from "./execute_webview";
import { isChangeBackgroundImage, isWindowReloadToLoadBackimage, closeRandomBackground } from "./utils";
import { errlog, promiseReject } from "../error";

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
    isChangeBackgroundImage().then(() => {
        // 判断需要设置的图片哈希码是否和当前背景图哈希码不相同
        return Promise.resolve(code !== backgroundImageConfiguration.getBackgroundNowImageCode());
    }).then(state => {
        if (state) {
            return Promise.resolve(settingProgress(code, index!));
        }
        showMessage({
            message: `此图片当前已设置为背景图`
        });
    }).catch((error) => {
        errlog(error);
    });
}

/** 执行设置背景图方法 */
function settingProgress (code: string, index: number) {
    return showProgress({
        location: 'Notification',
        title: '背景图设置中'
    }, (progress) => {
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
        let close = false;
        modifyCssFileForBackground(code, random).then(() => {
            // 如果传入random参数为true，则不会关闭随机切换背景图状态
            if (!random && backgroundImageConfiguration.getBackgroundIsRandom()) {
                // 如果选中背景图设置则会关闭随机切换背景图
                close = true;
                return backgroundImageConfiguration.setBackgroundIsRandom(false);
            }
        }).then(() => {
            if (close) {
                closeRandomBackground();
            }
            resolve();
        }).catch(err => {
            reject(promiseReject(err, 'setting'));
        });
    });
}