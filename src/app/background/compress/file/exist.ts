/** @description 判断指定图片是否存在压缩图 */

import type { Uri } from "vscode";
import { $rej } from "../../../../error";
import { createExParamPromise } from "../../../../utils";
import { isFileExits } from "../../../../common/file";
import { imageToCompressedPath } from "./getter";

/**
 * 根据哈希码判断指定哈希码的图片是否有压缩图
 * @param code 需要检测是否有压缩图片的哈希码
 */
export function checkHasBeenCompressed (code: string, uri?: Uri): Promise<{
    exist: boolean;
    uri: Uri;
}> {
    return new Promise((resolve, reject) => {
        imageToCompressedPath(code, uri)
        .then((uri) => {
            return createExParamPromise(isFileExits(uri), uri);
        })
        .then(([state, uri]) => {
            resolve({ exist: state, uri });
        })
        .catch(err => {
            reject($rej(err, checkHasBeenCompressed.name));
        });
    });
}