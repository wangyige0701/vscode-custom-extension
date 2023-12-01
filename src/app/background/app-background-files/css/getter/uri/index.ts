/** @description 获取css文件的uri地址 */

import type { Uri } from "vscode";
import * as path from "path";
import { getNodeModulePath, getNodeModulePathError } from "../../../../../../common";
import { $rej } from "../../../../../../error";
import { createUri, writeFileUri, createBuffer, isFileExitsSync } from "../../../../../../common/file";

/**
 * 获取vscode样式文件目录的Uri，文件不存在则进行创建
 * @param name 指定文件名
 * @param create 文件不存在是否创建
 * @returns 返回值为空表示文件不存在并且没有创建新文件
 */
export function getCssUri (name: string, create: boolean = true): Promise<Uri | void> {
    return new Promise((resolve, reject) => {
        if (!name) {
            return resolve();
        }
        const modulePath = getNodeModulePath();
        if (!modulePath) {
            return reject(getNodeModulePathError(getCssUri.name));
        }
        const uri = createUri(path.join(path.dirname(modulePath), 'vs', 'workbench', name));
        const cssFileExits = isFileExitsSync(uri);
        if (cssFileExits) {
            // 有指定路径
            return resolve(uri);
        }
        if (!create) {
            // 不创建文件，直接返回
            return resolve();
        }
        writeFileUri(uri, createBuffer(""))
        .then(() => {
            resolve(uri);
        })
        .catch(err => {
            reject($rej(err, getCssUri.name));
        });
    });
}