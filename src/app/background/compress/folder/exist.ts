/** @description 判断存放压缩图的文件夹是否存在 */

import { newUri, isFileExits, createDirectoryUri } from "../../../../common/file";
import { createExParamPromise } from "../../../../utils";
import { $rej } from "../../../../error";
import { imageStoreUri } from "../../image/folder/getter";
import { compressConfig } from "../../data/config";

/** 判断压缩文件夹是否存在，如果不存在，则进行创建 */
export function isCompressDirectoryExist (): Promise<void> {
    return new Promise((resolve, reject) => {
        const { compressFolderName } = compressConfig();
        imageStoreUri()
        .then(uri => {
            // 判断是否存在缩略图文件夹
            const folder = newUri(uri, compressFolderName);
            return createExParamPromise(isFileExits(folder), folder);
        })
        .then(([exist, folder]) => {
            if (!exist) {
                return createDirectoryUri(folder);
            }
        })
        .then(() => {
            resolve();
        })
        .catch(err => {
            reject($rej(err, isCompressDirectoryExist.name));
        });
    });
}