/**
 * 修改css文件
*/

import { dirname, join } from "path";
import { getDate } from "src/utils";
import { minmax } from "src/utils";
import { createBuffer, newUri, readFileUri, writeFileUri } from "src/utils/file";
import { backgroundImageConfiguration } from "src/workspace/background";
import { Uri, version } from "vscode";
import { imageStoreUri } from "./utils";
import { getVersion } from "src/version";

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
 * 获取样式目录下的文件Uri
 * @param name 
 * @returns 
 */
function getCssUri (name: string): Uri | undefined {
    if (name) {
        return Uri.file(join(dirname((require.main as NodeModule).filename), 'vs', 'workbench', name));
    }
    return;
}

/**
 * 修改css文件的背景图属性
 */
export function modifyCssFileForBackground (code: string) {
    return new Promise((resolve, reject) => {
        try {
            if (!code) throw new Error('null code');
            getCssContent(code).then(res => {
                console.log(res);
                resolve('')
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 删除css文件中背景图的修改内容
 */
export function deletebackgroundCssFileModification () {}

/**
 * 将背景样式写入外部样式文件
 * @param content 
 * @returns 
 */
function writeCssFile (content: string): Promise<void> {
    return new Promise((resolve, reject) => {
        try {
            const fileUri = getCssUri(externalFileName) as Uri;
            writeFileUri(fileUri, createBuffer(content)).then(() => {
                resolve();
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 获取设置body背景的样式内容
 * @param version 
 * @param code 
 */
function getCssContent (code: string): Promise<[string, info]> {
    return new Promise((resolve, reject) => {
        try {
            const imageUri = imageStoreUri();
            if (!imageUri) throw new Error('null uri');
            const extensionVer = getVersion();
            const date = getDate();
            readFileUri(newUri(imageUri, `${code}.back.wyg`)).then(image => {
                let opacity = backgroundImageConfiguration.getBackgroundOpacity();
                opacity = minmax(0.1, 1, opacity);
                opacity = +(0.95 + (-0.45 * opacity)).toFixed(2);
                resolve([
                    `${importStart+'\n'
                    }/**${'\n'
                    }* version [ ${extensionVer} ]${'\n'
                    }* date [ ${date} ]${'\n'
                    }* imageCode [ ${code} ]${'\n'
                    }*/${'\n'
                    }body {${'\n'
                    }   opcity: ${opacity};${'\n'
                    }   background-repeat: no-repeat;${'\n'
                    }   background-size: cover;${'\n'
                    }   background-position: center;${'\n'
                    }   background-image: url('${image.toString()}');${'\n'
                    }}${
                    '\n'+importEnd}`,
                    {
                        version: extensionVer,
                        date,
                        code
                    }
                ]);
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 获取vscode主样式文件内容
 * @returns 
 */
function getSourceCssFileContent (): Promise<[string, Uri]> {
    return new Promise((resolve, reject) => {
        try {
            const fileUri = getCssUri(cssName) as Uri;
            readFileUri(fileUri).then(res => {
                resolve([res.toString(), fileUri]);
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 将导入语句写入主样式文件中
 * @returns 
 */
function setSourceCssImportInfo () : Promise<void> {
    return new Promise((resolve, reject) => {
        try {
            getSourceCssFileContent().then(([content, uri]) => {
                writeFileUri(
                    uri,
                    createBuffer(content + `${'\n'+
                    importStart+'\n'
                    }@import "./${externalFileName}";${
                    '\n'+importEnd}`)
                ).then(() => {
                    resolve();
                });
            });
        } catch (error) {
            reject(error);
        }
    });
}