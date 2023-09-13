import { addImageToStorage } from ".";
import { WError, errlog, promiseReject } from "../../error";
import { base64ByFiletypeAndData, imageToBase64Type } from "../../utils/file";
import { showMessage } from "../../utils/interactive";
import { imageUrl } from "../../utils/regexp";
import { GetImage } from "../../utils/request/utils";
import { BackgroundConfiguration } from "../../workspace/background";
import { backgroundSendMessage } from "./execute_webview";
import { 
    getExternalCssModifyOpacityContent, 
    getExternalFileContent, 
    setSourceCssImportInfo, 
    writeExternalCssFile 
} from "./modify";
import { getNewBackgroundOpacity, isWindowReloadToLoadBackimage } from "./utils";

/**
 * 下载网络图片资源并发送至背景图列表
 * @param url 
 */
export function requestImageToBackground (url: string) {
    const sendMsg: string[] = [];
    getImageBase64ByRequest(url).then(data => {
        return addImageToStorage([data]);
    }).then(codes => {
        sendMsg.push(...codes);
    }).catch(err => {
        err && errlog(err);
    }).finally(() => {
        backgroundSendMessage({
            name: 'newImageNetwork',
            value: sendMsg
        });
    });
}

/**
 * 请求网络图片并转为base64数据
 * @param url 图片路径
 */
function getImageBase64ByRequest (url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const reg = url.match(imageUrl);
        if (!reg) {
            return reject({ warning: true, message: 'Illegal Image URL' });
        }
        GetImage(url).then(res => {
            return base64ByFiletypeAndData('image', imageToBase64Type(reg[2]), res);
        }).then(data => {
            resolve(data);
        }).catch(err => {
            if (err.warning) {
                showMessage({
                    type: 'error',
                    message: `${err.status??'Error'}: ${err.message??''} [ ${url} ]`,
                });
                return reject();
            }
            reject(promiseReject(err, getImageBase64ByRequest.name));
        });
    });
}

/**
 * 修改背景图透明度
 * @param opacity 透明度数据
 */
export function backgroundOpacityModify (opacity: number) {
    let sendOpacity: number = BackgroundConfiguration.getBackgroundOpacity;
    changeBackgroundFileOpacity(opacity).then(state => {
        if (state) {
            sendOpacity = opacity;
            isWindowReloadToLoadBackimage('透明度设置完成，是否重启窗口应用');
            return Promise.resolve(BackgroundConfiguration.setBackgroundOpacity(opacity));
        }
        // state为false，和当前透明度相同，不进行修改
        showMessage({
            message: `当前透明度已为${opacity}，若需修改，请输入0.1~1间的任意数字`
        });
    }).catch(err => {
        errlog(err);
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
 */
function changeBackgroundFileOpacity (opacity: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
        if (opacity === BackgroundConfiguration.getBackgroundOpacity) {
            return resolve(false);
        }
        getExternalFileContent().then(data => {
            const content = getExternalCssModifyOpacityContent(data[0], getNewBackgroundOpacity(opacity));
            return writeExternalCssFile(content);
        }).then(() => {
            return setSourceCssImportInfo();
        }).then(() => {
            resolve(true);
        }).catch(err => {
            reject(promiseReject(err, changeBackgroundFileOpacity.name));
        });
    });
}