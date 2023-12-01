/** @description css源文件中导入语句查询字符串部分替换 */

import { findSourceCssVersionContent } from "../../match";

/**
 * 替换源文件中导入语句查询字符串后的文本
 * @param content css文本
 * @param suffix 替换后的查询字符串
 */
export function replaceSourceQueryStringContent (content: string, suffix: string|number) {
    return content.replace(findSourceCssVersionContent, `$1${suffix}$3`);
}