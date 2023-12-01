/** @description 工作空间数据获取 */

import { BackgroundConfiguration, defaultPath } from "../../../../workspace";

/** 获取背景图资源存放路径 */
export function getBackgroundResourcePath (): string[] {
    return defaultPath;
}

/** 获取工作空间中的当前设置的背景图哈希码数据，如果没有数据，返回false */
export function getNowSettingCode (): Promise<string | false> {
    const storageCode = BackgroundConfiguration.getBackgroundNowImageCode;
    if (storageCode) {
        return Promise.resolve(storageCode);
    }
    return Promise.resolve(false);
}

/** 同步获取工作空间中的当前设置的背景图哈希码数据 */
export function getNowSettingCodeSync (): string | false {
    return BackgroundConfiguration.getBackgroundNowImageCode??false;
}

/** 获取工作空间中设置的图片储存文件夹路径 */
export function getImageStoreFolderPath (): string {
    return BackgroundConfiguration.getBackgroundStorePath;
}

/** 获取工作空间中的当前设置的背景透明度数据 */
export function getNowSettingOpacity (): number {
    return BackgroundConfiguration.getBackgroundOpacity;
}

/** 获取工作空间中的是否已经设置背景图状态 */
export function getNowIsSetBackground (): boolean {
    return BackgroundConfiguration.getBackgroundIsSetBackground;
}