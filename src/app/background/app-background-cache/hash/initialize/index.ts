/** @fileoverview 哈希码数据初始化，从工作空间储存数据中获取数据并存入缓存 */

import { backgroundHashCodes } from "../data";
import { getAllImageHashCodes } from "../../../app-background-workspace";

/** 从工作区中获取储存的哈希码数据并更新至缓存数组中 */
export function getHashCodesFromWorkspaceAndCache () {
    // 更新储存列表数据
    const caches = getAllImageHashCodes();
    backgroundHashCodes.setLength(caches.length);
    caches.forEach((item, index) => {
        if (backgroundHashCodes.get(index) !== item) {
            backgroundHashCodes.set(index, item);
        }
    });
}