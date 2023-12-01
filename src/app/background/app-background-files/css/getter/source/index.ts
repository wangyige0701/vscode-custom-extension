/** @description 获取源css文件相关数据 */

import type { Uri } from "vscode";
import { createExParamPromise } from "../../../../../../utils";
import { $rej } from "../../../../../../error";
import { getCssUri } from "../uri";
import { cssNameConfig } from "../../../../app-background-config";
import { readFileUri } from "../../../../../../common/file";

const { sourceCssFileName } = cssNameConfig();

/**
 * 获取vscode源样式文件内容，返回内容文本和路径uri
 * @returns 内容文本和路径uri
 */
export function getSourceCssFileContent (): Promise<[string, Uri] | void> {
    return new Promise((resolve, reject) => {
        getCssUri(sourceCssFileName, false)
        .then(uri => {
            if (uri) {
                return readFile(uri);
            }
        })
        .then(res => {
            resolve(res);
        })
        .catch(err => {
            reject($rej(err, getSourceCssFileContent.name));
        });
    });
}

function readFile (uri: Uri): Promise<[string, Uri]> {
    return new Promise((resolve, reject) => {
        createExParamPromise(readFileUri(uri), uri)
        .then(([res, uri]) =>{
            resolve([res.toString(), uri]);
        })
        .catch(err => {
            reject($rej(err, readFile.name));
        });
    });
}