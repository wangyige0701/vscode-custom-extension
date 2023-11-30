/** @description 移除css文件中标签包裹的自定义内容 */

import type { Uri } from "vscode";
import type { ContentAndUri } from "../../../../@types";
import { $rej } from "../../../../../../error";
import { findSourceCssPosition } from "../regexp";

/**
 * 通过标签名删除css文件的修改内容
 * @param content 需要被处理的文本
 */
function deleteContentByTagName (content: string, uri: Uri): Promise<ContentAndUri> {
    return new Promise((resolve, reject) => {
        Promise.resolve().then(() => {
            if (!content) {
                return resolve({content:"", uri});
            }
            content = content.replace(findSourceCssPosition, "");
            resolve({content, uri});
        }).catch(err => {
            reject($rej(err, deleteContentByTagName.name));
        });
    });
}
