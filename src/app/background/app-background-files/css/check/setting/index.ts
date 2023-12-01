/** @description 校验是否是设置的背景图 */

import { $rej } from "../../../../../../error";
import { getExternalCssFileContent, getExternalCssInfo } from "../../getter";

/**
 * 检查指定code是否是当前设置背景图的code
 * @param codeValue 
 * @returns 如果state为false时也传了code，则此code是最新需要被设置的图片哈希码
 */
export function checkIsSettingImage (codeValue: string): Promise<{
    state: boolean;
    code?: string;
}> {
    return new Promise((resolve, reject) => {
        if (!codeValue) {
            return resolve({
                state: false
            });
        }
        getExternalCssFileContent()
        .then(content => {
            return getExternalCssInfo(content[0]);
        })
        .then(data => {
            if (data) {
                const { ImageCode } = data;
                // 如果和上一次是一个哈希值，不再更新数据
                if (ImageCode === codeValue) {
                    return resolve({
                        state: true,
                        code: ImageCode
                    });
                }
            }
            resolve({
                state: false,
                code: codeValue
            });
        })
        .catch(err => {
            reject($rej(err, checkIsSettingImage.name));
        });
    });
}