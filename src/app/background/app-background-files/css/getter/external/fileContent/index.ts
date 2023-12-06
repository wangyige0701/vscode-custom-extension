/** @description 获取外部css文件的全部文本内容 */

import type { Uri } from "vscode";
import { cssNameConfig } from "../../../../../app-background-config";
import { getCssUri } from "../../uri";
import { createExParamPromise } from "../../../../../../../utils";
import { readFileUri } from "../../../../../../../common/file";
import { $rej } from "../../../../../../../error";

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