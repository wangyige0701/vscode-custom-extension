/** @fileoverview .wyg图片储存文件数据校验 */

import type { Uri, FileType } from "vscode";
import type { BufferAndCodeMergeType } from "@background/@types";
import { $rej } from "@/error";
import { newUri } from "@/common/file";
import { range, bisectionAsce } from "@/utils";
import { hashCodeCache } from "@background/data/hashCodeCache";
import { matchWYGFileName } from "@background/data/css/regexp";
import { getFilDataAndCode } from "./getter";

/**
 * 校验储存图片base64数据的文件并进行读取
 * @param files 指定目录下的所有文件列表
 * @param uri
 */
export function checkImageFiles (files: [string, FileType][], uri: Uri): Promise<BufferAndCodeMergeType[]> {
    return new Promise((resolve, reject) => {
        /** 异步处理数组 */
        const fileRequest: Array<Promise<{ buffer: Uint8Array, code: string }>> = [];
        /** 辅助检测数组 */
        const checkArray: number[] = [];
        for (const i of range(files.length)) {
            const file = files[i][0];
            // 对满足要求的文件进行文件数据读取
            const reg = file.match(matchWYGFileName);
            if (!reg) {
                continue;
            }
            const index = hashCodeCache.indexOf(reg[1]);
            // 需要加一个index为-1的判断，防止递归死循环
            const posi = index >= 0 ? bisectionAsce(checkArray, index) : 0;
            checkArray.splice(posi, 0, index);
            fileRequest.splice(posi, 0, getFilDataAndCode(newUri(uri, file), reg[1]));
        }
        Promise.all(fileRequest)
        .then(resolve)
        .catch(err => {
            reject($rej(err, checkImageFiles.name));
        });
    });
}
