/** @fileoverview 背景图图片文件储存文件夹设置模块 */

import { Uri } from "vscode";
import { showMessageWithConfirm } from "../../../../common/interactive";
import { $rej } from "../../../../error";
import { getImageStoreFolderPath } from "../../workspace/getter";
import { settingImageStoreFolderPath } from "../../workspace/setter";
import { sendAfterStorePathChange } from "../../webview/communication/send";

/**
 * 重新设置背景图图片文件储存文件夹
 * @param path 
 * @param reset 是否重置路径
 */
export async function resetImageStoreFolder (path: string, reset: boolean = false): Promise<void> {
    if (reset) {
        return await resetStoreFolder();
    }
    const uri = Uri.file(path);
    if (path && uri) {
        // 缓存数据
        await settingImageStoreFolderPath(uri.fsPath)
        .catch(err => {
            throw $rej(err, resetImageStoreFolder.name);
        });
        showMessageWithConfirm('背景图储存路径已切换为：'+uri.fsPath);
        sendAfterStorePathChange();
    }
    return;
}

/** 重置文件夹 */
async function resetStoreFolder () {
    if (!getImageStoreFolderPath()) {
        showMessageWithConfirm('当前储存路径已为默认路径');
        return;
    }
    await settingImageStoreFolderPath("")
    .catch(err => {
        throw $rej(err, resetImageStoreFolder.name);
    });
    showMessageWithConfirm('背景图储存路径已切换为默认路径');
    sendAfterStorePathChange();
}

