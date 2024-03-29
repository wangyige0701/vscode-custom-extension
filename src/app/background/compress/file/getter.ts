/** @fileoverview 获取压缩图的数据，不存在则创建 */

import type { Uri } from "vscode";
import { FileType } from "vscode";
import { uriStat, joinPathUri, newUri, readFileUri } from "../../../../common/file";
import { $rej } from "../../../../error";
import { checkHasBeenCompressed } from "./exist";
import { createCompressImage } from "./create";
import { compressConfig } from "../../data/config";
import { imageStoreUri } from "../../image/folder/getter";

/**
 * 当指定哈希码的图片没有压缩图时生成一张压缩图，否则跳出
 * @param code 图片哈希码
 * @param data 原图片base64数据
 * @param uri 如果传入参数，必须是图片存放路径的根路径
 */
export function getCompressImage (code: string, data: string, uri?: Uri): Promise<{
    code: string;
    data: string;
}> {
    return new Promise(resolve => {
        checkHasBeenCompressed(code, uri)
        .then(({ exist, uri }) => {
            if (!exist) {
                // 不存在进行创建
                return createCompressImage(uri, data);
            }
            // 存在则读取
            return readFileUri(uri);
        })
        .then(buffer => {
            resolve({
                code,
                data: buffer.toString()
            });
        })
        .catch(() => {
            resolve({ code, data: '' });
        });
    });
}

/**
 * 生成压缩图片的路径
 * @param code 需要压缩的图片code
 */
export function imageToCompressedPath (code: string, uri?: Uri): Promise<Uri> {
    return new Promise((resolve, reject) => {
        Promise.resolve(uri ? isUriFolder(uri) : imageStoreUri())
        .then(uri => {
            const { compressFileName, compressFolderName } = compressConfig();
            resolve(newUri(uri, compressFolderName, `${code}.${compressFileName}`));
        })
        .catch(err => {
            reject($rej(err, imageToCompressedPath.name));
        });
    });
}

/** 判断是否需要回退层级 */
function isUriFolder (uri: Uri): Promise<Uri> {
    return new Promise((resolve, reject) => {
        uriStat(uri)
        .then(({ type }) => {
            if (type === FileType.File) {
                return joinPathUri(uri, '..');
            }
            return uri;
        })
        .then(resolve)
        .catch(reject);
    });
}