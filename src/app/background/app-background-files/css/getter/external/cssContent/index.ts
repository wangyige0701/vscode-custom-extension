/** @description 获取外部css文件数据 */

import type { Uri } from "vscode";
import type { CssFileAnnotationInfo } from "../../../../../@types";
import { version } from "vscode";
import { getVersion } from "../../../../../../../version";
import { $rej } from "../../../../../../../error";
import { createExParamPromise, getDate } from "../../../../../../../utils";
import { readFileUri, newUri } from "../../../../../../../common/file";
import { imageStoreUri } from "../../../../../app-background-image";
import { getExternalCssFileContent } from "../fileContent";
import { getExternalCssInfo } from "../info";
import { externalCssFileTemplate, createWYGFileName } from "../../../template";

/**
 * 生成外部文件设置的背景样式字符串和相关信息，
 * 如果不需要更新数据即当前文件内的哈希码和需要设置的相同，则返回false
 * @param hashCode 图片哈希码
 */
export function getExternalCssContent (hashCode: string): Promise<[string, CssFileAnnotationInfo] | false> {
    return new Promise((resolve, reject) => {
        const extensionVer = getVersion();
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
                if (ImageCode === hashCode && VSCodeVersion === version && ExtensionVersion === extensionVer) {
                    return Promise.resolve(false);
                }
            }
            return externalFileWrite(storeUri, hashCode, {
                VSCodeVersion: version,
                ExtensionVersion: extensionVer,
                Date: date,
                ImageCode: hashCode
            });
        })
        .then(res => {
            if (res === false) {
                return resolve(false);
            }
            return resolve([res, {
                VSCodeVersion: version,
                ExtensionVersion: extensionVer,
                Date: date,
                ImageCode: hashCode
            }]);
        })
        .catch(err => {
            reject($rej(err, getExternalCssContent.name));
        });
    });
}

/** 数据写入外部css文件 */
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

