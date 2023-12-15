/** @fileoverview 获取外部css文件数据 */

import type { Uri } from "vscode";
import type { CssFileAnnotationInfo } from "@background/@types";
import { version as VSCODE_VERSION } from "vscode";
import { $rej } from "@/error";
import { readFileUri, newUri } from "@/common/file";
import { createExParamPromise, getDate } from "@/utils";
import { getCssUri } from "@background/data/css/uri";
import { cssNameConfig } from "@background/data/config";
import { imageStoreUri } from "@background/image/folder/getter";
import { createWYGFileName } from "@background/image/file/fileName";
import { findExternalCssPosition } from "@background/data/css/regexp";
import { externalCssFileTemplate } from "../template/external";

/**
 * 生成外部文件设置的背景样式字符串和相关信息，
 * 如果不需要更新数据即当前文件内的哈希码和需要设置的相同，则返回false
 * @param hashCode 图片哈希码
 */
export function getExternalCssContent (hashCode: string): Promise<[string, CssFileAnnotationInfo] | false> {
    return new Promise((resolve, reject) => {
        const date = getDate();
        imageStoreUri()
        .then(uri => {
            return createExParamPromise(getExternalCssFileContent(), uri);
        })
        .then(([content, storeUri]) => {
            return createExParamPromise(getExternalCssInfo(content[0]), storeUri);
        })
        .then(([data, storeUri]): Promise<false | string> => {
            if (data) {
                const { ImageCode, VSCodeVersion, ExtensionVersion } = data;
                // 如果和上一次是一个哈希值，并且vscode和插件版本号相同，不再更新数据
                if (ImageCode === hashCode && VSCodeVersion === VSCODE_VERSION && ExtensionVersion === EXTENSION_VERSION) {
                    return Promise.resolve(false);
                }
            }
            return externalFileWrite(storeUri, hashCode, {
                VSCodeVersion: VSCODE_VERSION,
                ExtensionVersion: EXTENSION_VERSION,
                Date: date,
                ImageCode: hashCode
            });
        })
        .then(res => {
            if (res === false) {
                return resolve(false);
            }
            return resolve([res, {
                VSCodeVersion: VSCODE_VERSION,
                ExtensionVersion: EXTENSION_VERSION,
                Date: date,
                ImageCode: hashCode
            }]);
        })
        .catch(err => {
            reject($rej(err, getExternalCssContent.name));
        });
    });
}

/** 获取写入外部css文件的数据 */
function externalFileWrite (storeUri: Uri, hashCode: string, info: CssFileAnnotationInfo): Promise<string> {
    return new Promise((resolve, reject) => {
        readFileUri(newUri(storeUri, createWYGFileName(hashCode)))
        .then(image => {
            return externalCssFileTemplate(Object.assign(info, {
                imageBase64: image.toString()
            }));
        })
        .then(resolve)
        .catch(reject);
    });
}

/**
 * 获取设置背景样式的外部css文件的版本、时间、哈希码信息
 * @param content
 */
export function getExternalCssInfo (content: string): Promise<CssFileAnnotationInfo | false> {
    return new Promise(resolve => {
        const reg = content.match(findExternalCssPosition);
        // 有匹配项返回信息
        if (reg) {
            return resolve({
                VSCodeVersion: reg[1],
                ExtensionVersion: reg[2],
                Date: reg[3],
                ImageCode: reg[4]
            });
        }
        resolve(false);
    });
}

/** 获取外部css文件内容 */
export function getExternalCssFileContent (): Promise<[string, Uri]> {
    return new Promise((resolve, reject) => {
        const { externalCssFileName } = cssNameConfig();
        // 获取指定路径uri，没有文件则创建
        getCssUri(externalCssFileName)
        .then(uri => {
            return createExParamPromise(readFileUri(uri!), uri!);
        })
        .then(([content, uri]) => {
            resolve([content.toString(), uri]);
        })
        .catch(err => {
            reject($rej(err, getExternalCssFileContent.name));
        });
    });
}
