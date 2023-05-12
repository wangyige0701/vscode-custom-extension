/**
 * 修改css文件
*/

import { dirname, join, resolve } from "path";
import { getDate, isBoolean, isString } from "../utils";
import { minmax } from "../utils";
import { createBuffer, newUri, readFileUri, writeFileUri } from "../utils/file";
import { backgroundImageConfiguration } from "../workspace/background";
import { Uri, version } from "vscode";
import { imageStoreUri } from "./utils";
import { getVersion } from "../version";

interface info {
    vsCodeVersion: string; // vscode版本号
    extensionVersion: string; // 当前版本号
    date: string; // 日期
    code: string; // 图片哈希码
}

const tagName = 'wangyige.background';
const importStart = `/* ${tagName}.start */`;
const importEnd = `/* ${tagName}.end */`;
const importStartMatch = `\\/\\* ${tagName}.start \\*\\/`;
const importEndMatch = `\\/\\* ${tagName}.end \\*\\/`;

const s = '\\s\*'; // 任意空格
const a = '\[\\s\\S\]\*'; // 任意字符
const ans = '\\S\*'; // 任意字符不包括空格
const ant = '\.\*'; // 任意字符不包括换行
const asa = '\\S\*\.\*\\S\{1\,\}';// 非空格开头非空格结尾，中间允许有空格，必须以非空格结尾
const findPosition = `${importStartMatch}(${a})${importEndMatch}`;

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
export function modifyCssFileForBackground (codeValue: string): Promise<void> {
    return new Promise((resolve, reject) => {
        try {
            if (!codeValue) throw new Error('null code');
            getCssContent(codeValue).then(res => {
                if (res === false) {
                    resolve();
                    return;
                }
                settingConfiguration(res[1]);
                return writeCssFile(res[0]);
            }).then(() => {
                return setSourceCssImportInfo();
            }).then(() => {
                resolve();
            }).catch(err => {
                throw err;
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
 * 检查指定code是否是当前设置背景图的code
 * @param codeValue 
 * @returns 
 */
export function checkCurentImageIsSame (codeValue: string): Promise<{ state:boolean, code?:string }> {
    return new Promise((resolve, reject) => {
        try {
            if (!codeValue) {
                resolve({ state: false });
                return;
            }
            getExternalFileContent().then(content => {
                return findInfo(content);
            }).then(data => {
                if (data) {
                    const { code } = data;
                    // 如果和上一次是一个哈希值，不再更新数据
                    if (code === codeValue) {
                        resolve({ state: true, code });
                        return;
                    }
                }
                resolve({ state: false });
            }).catch(err => {
                throw err;
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 设置缓存数据
 * @param options 
 */
function settingConfiguration (options: info) {
    if (options) {
        backgroundImageConfiguration.setBackgroundNowImagePath(options.code);
        backgroundImageConfiguration.setBackgroundIsSetBackground(true);
    }
}

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
            }).catch(err => {
                throw err;
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 获取外部图片样式css文件内容
 * @returns 
 */
function getExternalFileContent (): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            readFileUri(getCssUri(externalFileName)!).then(content => {
                resolve(content.toString());
            }).catch(err => {
                throw err;
            })
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 获取设置body背景的样式内容
 * @param codeValue 
 */
function getCssContent (codeValue: string): Promise<[string, info] | false> {
    return new Promise((resolve, reject) => {
        try {
            const imageUri = imageStoreUri();
            if (!imageUri) throw new Error('null uri');
            const extensionVer = getVersion();
            const date = getDate();
            getExternalFileContent().then(content => {
                return findInfo(content);
            }).then(data => {
                if (data) {
                    const { code, vsCodeVersion, extensionVersion } = data;
                    // 如果和上一次是一个哈希值，并且vscode和插件版本号相同，不再更新数据
                    if (code === codeValue && vsCodeVersion === version && extensionVersion === extensionVer) {
                        resolve(false);
                        return;
                    }
                }
                return readFileUri(newUri(imageUri, `${codeValue}.back.wyg`));
            }).then(image => {
                let opacity = backgroundImageConfiguration.getBackgroundOpacity();
                opacity = minmax(0.1, 1, opacity);
                opacity = +(0.95 + (-0.45 * opacity)).toFixed(2);
                resolve([
                    `${importStart+'\n'
                    }/**${'\n'
                    }* vsCodeVersion [ ${version} ]${'\n'
                    }* extensionVersion [ ${extensionVer} ]${'\n'
                    }* date [ ${date} ]${'\n'
                    }* imageCode [ ${codeValue} ]${'\n'
                    }*/${'\n'
                    }body {${'\n'
                    }   opacity: ${opacity};${'\n'
                    }   background-repeat: no-repeat;${'\n'
                    }   background-size: cover;${'\n'
                    }   background-position: center;${'\n'
                    }   background-image: url('${image}');${'\n'
                    }}${
                    '\n'+importEnd}`,
                    {
                        vsCodeVersion: version,
                        extensionVersion: extensionVer,
                        date,
                        code: codeValue
                    }
                ]);
            }).catch(err => {
                throw err;
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
                return isSourceCssFileModify(content, uri);
            }).then((data) => {
                if (data === true) {
                    resolve();
                    return;
                }
                const { content, uri } = data;
                return writeFileUri(
                    uri!,
                    createBuffer(`${importStart+'\n'
                    }@import url("./${externalFileName}");${
                    '\n'+importEnd}`+content)
                );
            }).then(() => {
                resolve();
            }).catch(err => {
                throw err;
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 校验源css文件是否已经被修改
 * @param content 
 * @param uri 
 * @returns 
 */
function isSourceCssFileModify (content: string, uri: Uri): Promise<{ content?:string, uri?:Uri } | true> {
    return new Promise((resolve, reject) => {
        try {
            const reg = content.match(new RegExp(findPosition));
            // 有匹配项返回去，不需要继续插入
            if (reg) {
                resolve(true);
            } else {
                resolve({ content, uri })
            }
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 获取背景设置css文件的相关信息
 * @param content 
 * @returns 
 */
function findInfo (content: string): Promise<info | false> {
    return new Promise((resolve, reject) => {
        try {
            const check = new RegExp(
                `${importStartMatch}${a}${
                    getReg('vsCodeVersion')
                }${a}${
                    getReg('extensionVersion')
                }${a}${
                    getReg('date')
                }${a}${
                    getReg('imageCode')
                }${a}${importEndMatch}`
            );
            const reg = content.match(check);
            // 有匹配项返回信息
            if (reg) {
                resolve({
                    vsCodeVersion: reg[1],
                    extensionVersion: reg[2],
                    date: reg[3],
                    code: reg[4]
                });
            } else {
                resolve(false);
            }
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 生成获取注释信息的正则字符串
 * @param name 
 * @returns 
 */
function getReg (name: string): string {
    return `${name}${s}\\[${s}(${asa})${s}\\]`;
}