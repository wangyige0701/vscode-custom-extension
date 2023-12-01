/** @description 工作空间数据获取 */

import { BackgroundConfiguration } from "../../../../workspace";

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