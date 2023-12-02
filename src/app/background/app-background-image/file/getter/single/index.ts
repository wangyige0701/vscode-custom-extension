/** @description 读取.wyg文件的数据 */

import type { Uri } from "vscode";
import type { BufferAndCodeMergeType } from "../../../../@types";
import { readFileUri } from "../../../../../../common/file";
import { $rej } from "../../../../../../error";

/**
 * 返回.wyg图片文件的类型化数组数据和对应哈希码
 * @param uri 
 * @param code 
 */
export function getFilDataAndCode (uri: Uri, code: string): Promise<BufferAndCodeMergeType> {
    return new Promise((resolve, reject) => {
        readFileUri(uri)
        .then(res => {
            resolve({
                buffer: res,
                code
            });
        })
        .catch(err => {
            reject($rej(err, getFilDataAndCode.name));
        });
    });
}