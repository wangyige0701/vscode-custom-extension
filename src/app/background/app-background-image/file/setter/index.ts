/** @description 背景图片创建模块 */

import { imageStoreUri } from "../../folder";
import { backgroundHashCodes as hashCodeArray, codeListRefresh } from "../../../app-background-cache";
import { createExParamPromise } from "../../../../../utils";
import { writeFileUri, newUri, createBuffer } from "../../../../../common/file";
import { createWYGFileName, getCompressImage } from "../../../app-background-files";
import { $rej } from "../../../../../error";

/** 创建.wyg文件储存图片文件，文件格式是 (哈希码.back.wyg) */
export function createFileStore (base64: string): Promise<string> {
    return new Promise((resolve, reject) => {
        imageStoreUri()
        .then(uri => {
            const code = hashCodeArray.newHashCode();
            // 原文件写入
            return createExParamPromise(writeFileUri(newUri(uri, createWYGFileName(code)), createBuffer(base64)), uri, code);
        })
        .then(([_, uri, $code]) => {
            // 写入压缩图
            return getCompressImage($code, base64, uri);
        })
        .then(({ code: $code, data }) => {
            // 新增一个哈希码数据
            return codeListRefresh($code, 'add', { addData: base64.toString(), compressData: data });
        })
        .then($code => {
            resolve($code);
        })
        .catch(err => {
            reject($rej(err, createFileStore.name));
        });
    });
}