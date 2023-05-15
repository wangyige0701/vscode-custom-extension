import { createFileStore } from ".";
import { errHandle } from "../error";
import { base64ByFiletypeAndData, imageToBase64Type } from "../utils/file";
import { setMessage } from "../utils/interactive";
import { imageUrl } from "../utils/regexp";
import { GetImage } from "../utils/request/utils";
import { backgroundImageConfiguration } from "../workspace/background";
import { backgroundSendMessage } from "./execute";
import { getExternalCssModifyOpacityContent, getExternalFileContent, writeExternalCssFile } from "./modify";
import { getNewBackgroundOpacity, isWindowReloadToLoadBackimage } from "./utils";

/**
 * 下载网络图片资源并发送至背景图列表
 * @param url 
 */
export function requestImageToBackground (url: string) {
    let sendMsg: [string, string] | undefined = undefined;
    getImageBase64ByRequest(url).then(data => {
        return createFileStore(data);
    }).then(({ hashCode, base64 }) => {
        sendMsg = [base64, hashCode];
    }).catch(err => {
        errHandle(err);
    }).finally(() => {
        backgroundSendMessage({
            name: 'newImageNetwork',
            value: sendMsg
        });
    });
}

/**
 * 请求网络图片并转为base64数据
 * @param url 
 * @returns 
 */
function getImageBase64ByRequest (url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            const reg = url.match(imageUrl);
            if (!reg) {
                reject(new Error('Illegal Image URL'));
                return;
            }
            GetImage(url).then(res => {
                return base64ByFiletypeAndData('image', imageToBase64Type(reg[2]), res);
            }).then(data => {
                resolve(data);
            }).catch(err => {
                reject(err);
            });
        } catch (error) {
            errHandle(error);
        }
    });
}

/**
 * 修改背景图透明度
 * @param opacity 
 */
export function backgroundOpacityModify (opacity: number) {
    let sendOpacity: number = backgroundImageConfiguration.getBackgroundOpacity();
    changeBackgroundFileOpacity(opacity).then(state => {
        if (state) {
            backgroundImageConfiguration.setBackgroundOpacity(opacity);
            sendOpacity = opacity;
            isWindowReloadToLoadBackimage('透明度设置完成，是否重启窗口应用');
        } else {
            // state为false，和当前透明度相同，不进行修改
            setMessage({
                message: `当前透明度已为${opacity}，若需修改，请输入0.1~1间的任意数字`
            });
        }
    }).catch(err => {
        errHandle(err);
    }).finally(() => {
        // 发送通信，返回设置好的透明度，并关闭按钮加载状态
        backgroundSendMessage({
            name: 'nowBackgroundOpacity',
            value: sendOpacity
        });
    });
}

/**
 * 将透明度重新写入外部css文件
 * @param opacity 
 * @returns 
 */
function changeBackgroundFileOpacity (opacity: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
        try {
            if (opacity === backgroundImageConfiguration.getBackgroundOpacity()) {
                resolve(false);
                return;
            }
            getExternalFileContent().then(data => {
                const content = getExternalCssModifyOpacityContent(data[0], getNewBackgroundOpacity(opacity));
                return writeExternalCssFile(content);
            }).then(() => {
                resolve(true);
            }).catch(err => {
                reject(err);
            });
        } catch (error) {
            errHandle(error);
        }
    });
}