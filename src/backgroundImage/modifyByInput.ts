import { createFileStore } from ".";
import { errHandle } from "../error";
import { base64ByFiletypeAndData, imageToBase64Type } from "../utils/file";
import { imageUrl } from "../utils/regexp";
import { GetImage } from "../utils/request/utils";
import { backgroundSendMessage } from "./execute";

/**
 * 下载网络图片资源
 * @param url 
 */
export function requestImageToBackground (url: string) {
    getImageBase64ByRequest(url).then(data => {
        return createFileStore(data);
    }).then(({ hashCode, base64 }) => {
        backgroundSendMessage({
            name: 'newImageNetwork',
            value: [base64, hashCode]
        });
    }).catch(err => {
        backgroundSendMessage({
            name: 'newImageNetwork',
            value: undefined
        });
        errHandle(err);
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