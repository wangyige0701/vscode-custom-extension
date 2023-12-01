/** @description 获取图片文件储存文件夹的uri */

import type { Uri } from "vscode";
import { $rej } from "../../../../../error";
import { joinPathUri, createUri } from "../../../../../common/file";
import { ExtensionUri } from "../../../../../common/system";
import { imageStoreUriExits } from "../exist";
import { getImageStoreFolderPath, getBackgroundResourcePath } from "../../../app-background-workspace";

/** 获取储存背景图资源的uri，指定路径不存在则会进行创建 */
export function imageStoreUri (): Promise<Uri> {
    return new Promise((resolve, reject) => {
        imageStoreUriExits(getPathUri())
        .then(resolve)
        .catch(err => {
            reject($rej(err, imageStoreUri.name));
        });
    });
}

/** 获取uri数据 */
function getPathUri () {
    const path = getImageStoreFolderPath();
    if (path) {
        // 工作空间内储存有路径数据
        return createUri(path);
    } else {
        // 没有数据则获取插件路径
        return joinPathUri(ExtensionUri.get, ...getBackgroundResourcePath());
    }
}