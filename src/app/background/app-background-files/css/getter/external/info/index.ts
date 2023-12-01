/** @description 获取外部css文件中的配置信息 */

import type { CssFileAnnotationInfo } from "../../../../../@types";
import { findExternalCssPosition } from "../../../match";

/**
 * 获取设置背景样式的外部css文件的版本、时间、哈希码信息
 * @param content 
 */
export function getExternalCssInfo (content: string): Promise<CssFileAnnotationInfo | false> {
    return new Promise(resolve => {
        const reg = content.match(findExternalCssPosition);
        // 有匹配项返回信息
        if (reg) {
            return resolve({
                VSCodeVersion: reg[1],
                ExtensionVersion: reg[2],
                Date: reg[3],
                ImageCode: reg[4]
            });
        }
        resolve(false);
    });
}