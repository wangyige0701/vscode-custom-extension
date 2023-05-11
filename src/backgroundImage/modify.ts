/**
 * 修改css文件
*/

import { dirname, join } from "path";
import { minmax } from "src/utils";
import { readFileUri } from "src/utils/file";
import { backgroundImageConfiguration } from "src/workspace/background";
import { Uri, version } from "vscode";

interface info {
    version: string; // 当前版本号
    date: string; // 日期
    code: string; // 图片哈希码
}

const tagName = 'wangyige.background';
const importStart = `/* ${tagName}.start */`;
const importEnd = `/* ${tagName}.end */`;

const findPosition = `${importStart}(.*?)${importEnd}`;

// vscode的css文件
const cssName = version >= '1.38' ? 'workbench.desktop.main.css' : 'workbench.main.css';

// 写背景图的css文件名
const externalFileName = 'backgroundImageInfo.css';

/**
 * 获取样式目录下的文件
 * @param name 
 * @returns 
 */
function getCssUri (name: string): string | undefined {
    if (name) {
        return join(dirname((require.main as NodeModule).filename), 'vs', 'workbench', name);
    }
    return;
}

/**
 * 修改css文件的背景图属性
 */
export function modifyCssFileForBackground () {}

/**
 * 删除css文件中背景图的修改内容
 */
export function deletebackgroundCssFileModification () {}

/**
 * 
 * @param version 
 * @param code 
 */
function getCssContent (version: string, code: string) {
    let opacity = backgroundImageConfiguration.getBackgroundOpacity();
    opacity = minmax(0.1, 1, opacity);
    opacity = 0.5 + (0.4)
}

/**
 * 获取vscode css文件内容
 * @returns 
 */
function getSourceCssFileUri (): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            const filePath = getCssUri(cssName);
            readFileUri(Uri.file(filePath!)).then(res => {
                resolve(res.toString());
            });
        } catch (error) {
            reject(error);
        }
    });
}

function getSourceCssImportInfo (content: string) : Promise<void> {
    return new Promise((resolve, reject) => {
        
    });
}