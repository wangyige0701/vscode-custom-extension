/** @fileoverview 背景图片选择模块 */

import type { Uri } from "vscode";
import { selectFile } from "../../../../common/interactive";
import { imageFilesConfig } from "../../data/config";
import { getDefaultSelectPath } from "../../workspace/getter";
import { settingDefaultSelectPath } from "../../workspace/setter";
import { $rej } from "../../../../error";
import { imageToBase64 } from "../../../../common/file";
import { addImageToStorage } from "../../data-operate/hashCodeCache";
import { sendAfterNewImagesCreate } from "../../webview/communication/send";
import { errlog } from "../../../../error";

/** 侧栏webview页面从本地文件选择背景图 */
export function selectImage () {
    const { imageFilters } = imageFilesConfig();
    const sendMsg: string[] = [];
    selectFile({
        many: true,
        files: true,
        filters: imageFilters,
        defaultUri: getDefaultSelectPath()
    })
    .then(({ uri, dirName }) => {
        return saveSelectPath(dirName, uri);
    })
    .then(uris => {
        return Promise.all(
            uris.map(uri => imageToBase64(uri.fsPath))
        );
    })
    .then(base64s => {
        return addImageToStorage(base64s);
    })
    .then(codes => {
        sendMsg.push(...codes);
    })
    .catch(err => {
        errlog(err, true);
    })
    .finally(() => {
        sendAfterNewImagesCreate(sendMsg);
    });
}

/** 保存文件夹选择默认路径 */
function saveSelectPath (dirName: string, uri: Uri[]): Promise<Uri[]> {
    return new Promise((resolve, reject) => {
        // 选择一次文件后保存默认选择路径
        settingDefaultSelectPath(dirName)
        .then(() => {
            resolve(uri);
        })
        .catch(reject);
    });
}