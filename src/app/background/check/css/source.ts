/** @fileoverview 校验vscode样式的源css文件信息 */

import type { Uri } from "vscode";
import { findSourceCssPosition } from "../../data/css/regexp";

/**
 * 校验源css文件是否已经被修改，即是否已经添加引入外部css文件的语句，是则返回true，可以跳过
 * @param content 
 * @param uri 
 */
export async function isSourceCssFileModify (content: string, uri: Uri): Promise<{
    content: string;
    uri: Uri;
    exits: boolean;
}> {
    // 有匹配项返回，exits字段为true
    return {
        content,
        uri,
        exits: content.match(findSourceCssPosition) ? true : false
    };
}