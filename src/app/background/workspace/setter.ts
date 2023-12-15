/** @fileoverview 设置工作空间配置的背景图哈希码数据 */

import type { CssFileAnnotationInfo } from "@background/@types";
import { $rej } from "@/error";
import { BackgroundConfiguration } from "@/workspace";

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
                return settingNowImageCode(options.ImageCode);
            }
            return settingRandomCode(options.ImageCode);
        })
        .then(resolve)
        .catch(err => {
            reject($rej(err, settingConfiguration.name));
        });
    });
}

/** 设置当前图片哈希码数据 */
export function settingNowImageCode (value: string) {
    return Promise.resolve(BackgroundConfiguration.setBackgroundNowImageCode(value));
}

/** 更改工作空间中的加载状态属性 */
export function changeLoadStateToTrue () {
    return Promise.resolve(BackgroundConfiguration.setBackgroundLoad(true));
}

/** 重置图片路径数据 */
export function refreshImagesPath (data: string[]) {
    return BackgroundConfiguration.refreshBackgroundImagePath(data);
}

/** 设置工作空间哈希码储存数据 */
export function settingAllHashCodes (code: string, type: 'add' | 'delete') {
    return BackgroundConfiguration.setBackgroundAllImageCodes(code, type);
}

/** 修改是否随机切换背景的状态 */
export function changeIsRandomState (state: boolean) {
    return Promise.resolve(BackgroundConfiguration.setBackgroundIsRandom(state));
}

/** 修改工作空间中储存的随机图片哈希码 */
export function settingRandomCode (firstCode: string): Promise<void>;
export function settingRandomCode (...otherCodes: string[]): Promise<void>;
export function settingRandomCode (firstCode: string, ...otherCodes: string[]) {
    if (otherCodes.length === 0) {
        return Promise.resolve(BackgroundConfiguration.setBackgroundRandomCode(firstCode));
    } else {
        return Promise.resolve(BackgroundConfiguration.setBackgroundRandomList([firstCode, ...otherCodes]));
    }
}

/** 设置默认文件夹路径 */
export function settingDefaultSelectPath (path: string) {
    return Promise.resolve(BackgroundConfiguration.setBackgroundSelectDefaultPath(path));
}

/** 设置透明度 */
export function settingOpacity (value: number) {
    return Promise.resolve(BackgroundConfiguration.setBackgroundOpacity(value));
}

/** 设置图片储存文件夹路径 */
export function settingImageStoreFolderPath (path: string) {
    return Promise.resolve(BackgroundConfiguration.setBackgroundStorePath(path));
}
