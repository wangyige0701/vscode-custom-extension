/** @description 读取所有背景图文件数据 */

import type { Uri, FileType } from "vscode";
import { imageStoreUri } from "../../../folder";
import { createExParamPromise } from "../../../../../../utils";
import { readDirectoryUri } from "../../../../../../common/file";
import { $rej } from "../../../../../../error";

/** 
 * 获取背景图目录下的所有文件，并校验路径下的文件夹是否存在
 */
export function getAllImageFilesData (): Promise<{
    files: [string, FileType][];
    uri: Uri;
}> {
    return new Promise((resolve, reject) => {
        imageStoreUri()
        .then(uri => {
            return createExParamPromise(readDirectoryUri(uri), uri);
        })
        .then(([res, uri]) => {
            resolve({ files: res, uri });
        })
        .catch(err => {
            reject($rej(err, getAllImageFilesData.name));
        });
    });
}