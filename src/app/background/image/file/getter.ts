/** @fileoverview 读取所有背景图文件数据，读取指定.wyg文件 */

import type { Uri, FileType } from "vscode";
import type { BufferAndCodeMergeType } from "../../@types";
import { imageStoreUri } from "../folder/getter";
import { createExParamPromise } from "../../../../utils";
import { readDirectoryUri, readFileUri } from "../../../../common/file";
import { $rej } from "../../../../error";

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