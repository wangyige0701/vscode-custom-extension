/** @description 设置工作空间配置的背景图哈希码数据 */

import type { CssFileAnnotationInfo } from "../../@types";
import { $rej } from "../../../../error";
import { BackgroundConfiguration } from "../../../../workspace";

/**
 * 设置当前背景哈希码缓存，将是否设置背景状态值改为true
 * @param options 
 * @param random 是否是随机切换背景图方法内调用
 */
export function settingConfiguration (options: CssFileAnnotationInfo, random: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!options) {
            return resolve();
        }
        Promise.resolve(BackgroundConfiguration.setBackgroundIsSetBackground(true))
        .then(() => {
            // 当不是随机切换时，将code存入当前图片缓存，否则存入随机切换图片缓存
            if (!random) {
                return BackgroundConfiguration.setBackgroundNowImageCode(options.ImageCode);
            }
            return BackgroundConfiguration.setBackgroundRandomCode(options.ImageCode);
        })
        .then(resolve)
        .catch(err => {
            reject($rej(err, settingConfiguration.name));
        });
    });
}

/** 更改缓存中的加载状态属性 */
export function changeLoadStateToTrue () {
    BackgroundConfiguration.setBackgroundLoad(true);
}

/** 重置图片路径数据 */
export function refreshImagesPath (data: string[]) {
    return BackgroundConfiguration.refreshBackgroundImagePath(data);
}