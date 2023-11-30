/** @description 背景图片选择模块 */

import { BackgroundConfiguration } from "../../../../workspace/background";
import { imageFilesConfig } from "../../config/data";


const {
    imageFilters
} = imageFilesConfig();

/** 选择文件的默认路径 */
var selectFileDefaultPath = BackgroundConfiguration.getBackgroundSelectDefaultPath;

/** 侧栏webview页面从本地文件选择背景图 */
export function selectImage () {
    const sendMsg: string[] = [];
    selectFile({
        many: true,
        files: true,
        filters: imageFilters,
        defaultUri: selectFileDefaultPath
    }).then(({ uri, dirName }) => {
        return <Promise<Uri[]>>new Promise((resolve, reject) => {
            // 选择一次文件后保存默认选择路径
            Promise.resolve(
                BackgroundConfiguration.setBackgroundSelectDefaultPath(selectFileDefaultPath = dirName)
            ).then(() => {
                resolve(uri);
            }).catch(err => {
                reject($rej(err, selectImage.name + ' > ' + selectFile.name));
            });
        });
    }).then(uris => {
        return Promise.all(
            uris.map(uri => imageToBase64(uri.fsPath))
        );
    }).then(base64s => {
        return addImageToStorage(base64s);
    }).then(codes => {
        sendMsg.push(...codes);
    }).catch(err => {
        errlog(err, true);
    }).finally(() => {
        backgroundSendMessage({
            name: 'newImage',
            value: sendMsg
        });
    });
}