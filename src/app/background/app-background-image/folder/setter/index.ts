/** @description 背景图图片文件储存文件夹设置模块 */

import { Uri } from "vscode";
import { showMessageWithConfirm } from "../../../../../common/interactive";
import { BackgroundConfiguration } from "../../../../../workspace/background";
import { $rej } from "../../../../../error";
import { backgroundSendMessage } from "../../../app-background-webview";

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
        await Promise.resolve(
            BackgroundConfiguration.setBackgroundStorePath(uri.fsPath)
        ).catch(err => {
            throw $rej(err, resetImageStoreFolder.name);
        });
        showMessageWithConfirm('背景图储存路径已切换为：'+uri.fsPath);
        sendStoreChangeMessage();
    }
    return;
}

/** 重置文件夹 */
async function resetStoreFolder () {
    if (!BackgroundConfiguration.getBackgroundStorePath) {
        showMessageWithConfirm('当前储存路径已为默认路径');
        return;
    }
    await Promise.resolve(
        BackgroundConfiguration.setBackgroundStorePath("")
    ).catch(err => {
        throw $rej(err, resetImageStoreFolder.name);
    });
    showMessageWithConfirm('背景图储存路径已切换为默认路径');
    sendStoreChangeMessage();
}

/** 背景图储存路径修改通知 */
function sendStoreChangeMessage () {
    backgroundSendMessage({
        name: 'backgroundStorePathChange',
        value: true
    });
}