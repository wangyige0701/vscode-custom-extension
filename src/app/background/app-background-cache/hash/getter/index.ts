/** @fileoverview 缓存数据获取 */

import { backgroundHashCodes } from "../data";
import { BackgroundConfiguration } from "../../../../../workspace/background";

/** 从工作区中获取储存的哈希码数据并更新至缓存数组中 */
export function refreshImageCodeList () {
    // 更新储存列表数据
    const cache: string[] = BackgroundConfiguration.getBackgroundAllImageCodes;
    backgroundHashCodes.setLength(cache.length);
    cache.forEach((item, index) => {
        if (backgroundHashCodes.get(index) !== item) {
            backgroundHashCodes.set(index, item);
        }
    });
}