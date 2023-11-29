import { Uri } from "vscode";
import { createDirectoryUri, isFileExits } from "../../../../common/file";
import { showMessageWithConfirm } from "../../../../common/interactive";
import { BackgroundConfiguration } from "../../../../workspace/background";
import { WError, $rej } from "../../../../error";
import { backgroundSendMessage } from "../../webview/executeWebview";

/**
 * 校验指定路径是否存在，不存在进行创建
 * @param uri 
 */
export function imageStoreUriExits (uri: Uri): Promise<Uri> {
    return new Promise((resolve, reject) => {
        if (!uri) {
            return reject(new WError('Undefined Uri', {
                position: 'Parameter',
                FunctionName: imageStoreUriExits.name,
                ParameterName: 'uri'
            }));
        }
        isFileExits(uri).then(res => {
            if (!res) {
                // 文件夹不存在进行创建
                return createDirectoryUri(uri);
            }
        }).then(() => {
            resolve(uri);
        }).catch(err => {
            reject($rej(err, imageStoreUriExits.name));
        });
    });
}

/**
 * 重新设置背景图储存路径数据
 * @param path 
 * @param reset 是否重置路径
 */
export async function resetImageStorePath (path: string, reset: boolean = false): Promise<void> {
    if (reset) {
        if (!BackgroundConfiguration.getBackgroundStorePath) {
            showMessageWithConfirm('当前储存路径已为默认路径');
            return Promise.resolve();
        }
        await Promise.resolve(
            BackgroundConfiguration.setBackgroundStorePath("")
        ).catch(err => {
            return Promise.reject($rej(err, resetImageStorePath.name));
        });
        showMessageWithConfirm('背景图储存路径已切换为默认路径');
        sendStoreChangeMessage();
        return Promise.resolve();
    }
    const uri = Uri.file(path);
    if (path && uri) {
        // 缓存数据
        await Promise.resolve(
            BackgroundConfiguration.setBackgroundStorePath(uri.fsPath)
        ).catch(err => {
            return Promise.reject($rej(err, resetImageStorePath.name));
        });
        showMessageWithConfirm('背景图储存路径已切换为：'+uri.fsPath);
        sendStoreChangeMessage();
    }
    return Promise.resolve();
}

/** 背景图储存路径修改通知 */
function sendStoreChangeMessage () {
    backgroundSendMessage({
        name: 'backgroundStorePathChange',
        value: true
    });
}