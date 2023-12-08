/** @fileoverview 生成图片.wyg格式文件 */

/** 生成一个储存图片数据的.wyg格式文件 */
export function createWYGFileName (hashCode: string) {
    return `${hashCode}.back.wyg`;
}