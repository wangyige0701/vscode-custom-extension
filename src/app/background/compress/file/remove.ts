/** @fileoverview 删除一张压缩图 */

import { $rej } from "@/error";
import { createExParamPromise } from "@/utils";
import { isFileExits, uriDelete } from "@/common/file";
import { imageToCompressedPath } from "./getter";

/**
 * 根据哈希码删除压缩图
 */
export function deleteCompressByCode (code: string): Promise<void> {
    return new Promise((resolve, reject) => {
        imageToCompressedPath(code)
        .then(uri => {
            return createExParamPromise(isFileExits(uri), uri);
        })
        .then(([exist, uri]) => {
            if (exist) {
                return uriDelete(uri);
            }
        })
        .then(() => {
            resolve();
        })
        .catch(err => {
            reject($rej(err, deleteCompressByCode.name));
        });
    });
}
