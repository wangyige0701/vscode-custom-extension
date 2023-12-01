/** @description vscode样式源css文件导入语句模板字符串 */

import { cssTagNameConfig, cssNameConfig } from "../../../../app-background-config";

/**
 * 生成一个源css文件中的导入语句字符串
 * @param queryString 导入语句的查询字符串
 */
export function sourceCssFileTemplate (queryString: string|number) {
    const {
        importStart,
        importEnd
    } = cssTagNameConfig();
    const {
        externalCssFileName
    } = cssNameConfig();
    return `${importStart}\n@import url("./${externalCssFileName}?${queryString}");\n${importEnd}`;
}