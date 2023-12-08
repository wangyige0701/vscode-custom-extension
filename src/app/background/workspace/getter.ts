/** @fileoverview 工作空间数据获取 */

import { BackgroundConfiguration, defaultPath } from "../../../workspace";

/** 获取背景图资源存放路径 */
export function getBackgroundResourcePath (): string[] {
    return defaultPath;
}

/** 同步获取工作空间中的当前设置的背景图哈希码数据 */
export function getNowSettingCode (): string {
    return BackgroundConfiguration.getBackgroundNowImageCode;
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

/** 获取工作空间中储存的所有图片哈希码 */
export function getAllImageHashCodes (): string[] {
    return BackgroundConfiguration.getBackgroundAllImageCodes;
}

/** 获取工作空间中储存的是否设置了随机背景的状态 */
export function getNowIsSetRandom (): boolean {
    return BackgroundConfiguration.getBackgroundIsRandom;
}

/** 获取工作空间中储存的随机图片列表 */
export function getRandomList (): string[] {
    return BackgroundConfiguration.getBackgroundRandomList;
}

/** 获取打开文件夹的默认路径 */
export function getDefaultSelectPath (): string {
    return BackgroundConfiguration.getBackgroundSelectDefaultPath;
}

/** 获取当前需要设置的随机图片哈希码 */
export function getNowRandomCode () : string {
    return BackgroundConfiguration.getBackgroundRandomCode;
}