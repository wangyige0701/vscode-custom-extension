/** @description 替换css文件中的透明度部分 */


import { externalCssOpacityModify } from "../regexp";

/**
 * 获取外部css文件修改了透明度后的内容
 * @param content 被替换的文本
 * @param value 替换的透明度数据
 */
export function replaceExternaOpacityContent (content: string, value: number): string {
    return content.replace(externalCssOpacityModify, `$1${value}$3${value}$5`);
}