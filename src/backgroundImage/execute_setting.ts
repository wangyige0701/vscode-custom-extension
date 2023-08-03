import { modifyCssFileForBackground } from "./modify";
import { showProgress } from "../utils/interactive";
import { delay } from "../utils";
import { backgroundImageConfiguration } from "../workspace/background";
import { backgroundSendMessage } from "./execute_webview";
import { isChangeBackgroundImage, isWindowReloadToLoadBackimage, closeRandomBackground } from "./utils";
import { errHandle } from "../error";

/**
 * webview端点击图片设置背景图处理方法
 * @param param 传入点击图片的哈希码和在webview列表中的索引位置，如果是随机设置背景图则不需要传index
 */
export function settingImage ({ code, index }: {
    code: string;
    index?: number;
}, random: boolean = false): undefined | Promise<void> {
    if (!random) {
        // 如果不是随机切换背景图，则表示当前需要弹出提示
        isChangeBackgroundImage().then(() => {
            showProgress({
                location: 'Notification',
                title: '背景图设置中'
            }, (progress) => {
                return <Promise<void>> new Promise(resolve => {
                    setting(code, random).then(() => {
                        backgroundSendMessage({
                            name: 'settingBackgroundSuccess',
                            value: index!
                        });
                        progress.report({
                            message: '设置成功',
                            increment: 100
                        });
                        // 延迟500毫秒关闭进度条
                        return delay(500);
                    }).then(() => {
                        isWindowReloadToLoadBackimage();
                    }).finally(() => {
                        resolve();
                    });
                }); 
            });
        }).catch((error) => {
            errHandle(error);
        });
    } else {
        // 随机切换背景图在组件停止运行前进行，不进行弹框提示
        return setting(code, random);
    }
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
            reject(err);
        });
    });
}