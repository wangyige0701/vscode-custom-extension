/** @description 源css文件修改 */

import type { Uri } from "vscode";
import { getSourceCssFileContent } from "../getter/source";
import { isSourceCssFileModify } from "../check/source";
import { replaceSourceQueryStringContent } from "../../data/cssQueryStringReplace";
import { createBuffer, writeFileUri } from "../../../../common/file";
import { sourceCssFileTemplate } from "../template/source";
import { $rej } from "../../../../error";
import { reChecksum } from "../../../../common";

/**
 * 将导入语句写入源css样式文件中
 * @param init 是否在初始化时调用，初始化调用此方法仅为校验，不需要进行文件修改
 */
export function setSourceCssImportInfo (init: boolean = false) : Promise<{modify:boolean}> {
    return new Promise((resolve, reject) => {
        getSourceCssFileContent().then(data => {
            if (data) {
                // 有数据，进行修改
                return handleChange(...data, init);
            } else {
                // 没有数据返回false
                return false;
            }
        })
        .then((modifyState) => {
            resolve({
                modify: modifyState
            });
        })
        .catch(err => {
            reject($rej(err, setSourceCssImportInfo.name));
        });
    });
}

function handleChange (content: string, uri: Uri, init: boolean): Promise<boolean> {
    return new Promise((resolve, reject) => {
        isSourceCssFileModify(content, uri)
        .then(({ content, uri, exits }) => {
            return changeSourceCssFile(content, uri, exits, init, Date.now());
        })
        .then(data => {
            return needModify(data);
        })
        .then(resolve)
        .catch(reject);
    });
}

function changeSourceCssFile (content: string, uri: Uri, exits: boolean, init: boolean, timestamp: number): false | [Buffer, Uri] {
    // 源文件满足修改格式并且当前是初始化校验调用，则不进行文件改写并且通知外部函数当前未修改
    if (exits && init) {
        return false;
    }
    // 修改过源文件需要更换路径后的时间戳，去除缓存
    if (exits) {
        // 不是初始化校验更新查询字符串的时间戳数据
        return [createBuffer(replaceSourceQueryStringContent(content, timestamp)), uri];
    } else {
        // 没有修改过源文件直接修改
        return [createBuffer(sourceCssFileTemplate(timestamp) + content), uri];
    }
}

/** 判断是否需要调用文件操作方法 */
function needModify (data: false | [Buffer, Uri]) {
    if (data === false) {
        return data;
    }
    return sourceCeeFileWriteAndChecksum(...data);
}

/**
 * 源css文件修改并且在修改完成后重置校验和数据
 * @param uri 源文件的uri数据
 */
export function sourceCeeFileWriteAndChecksum (content: Uint8Array, uri: Uri): Promise<true> {
    return new Promise((resolve, reject) => {
        writeFileUri(uri, content)
        .then(() => {
            return reChecksum(uri);
        })
        .then(() => {
            resolve(true);
        })
        .catch(reject);
    });
}