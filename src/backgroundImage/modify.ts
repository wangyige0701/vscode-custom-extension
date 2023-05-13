/**
 * 修改css文件，修改部分包括vscode的源css文件和写入body背景样式的外部css文件
*/

import { dirname, join } from "path";
import { getDate } from "../utils";
import { minmax } from "../utils";
import { createBuffer, newUri, readFileUri, writeFileUri } from "../utils/file";
import { backgroundImageConfiguration } from "../workspace/background";
import { Uri, version } from "vscode";
import { changeLoadState, imageStoreUri, setBackgroundImageSuccess } from "./utils";
import { getVersion } from "../version";
import { info } from "./data";



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
/**
 * 匹配源css文件正则
 */
const findSourceCssPosition = `${importStartMatch}(${a})${importEndMatch}`;
/**
 * 匹配写入外部css文件信息正则
 */
const findImageCssPosition = 
    `${importStartMatch}${a}${
        getReg('vsCodeVersion')
    }${a}${
        getReg('extensionVersion')
    }${a}${
        getReg('date')
    }${a}${
        getReg('imageCode')
    }${a}${importEndMatch}`;

/**
 * 获取外部css文件中的透明度值正则
 */
const findImageCssOpacityData = 
    `${importStartMatch}${a}body${s}\{${a}opacity${s}\:${s}(${ans})${s};${a}\}${a}${importEndMatch}`;

/**
 * vscode的源css文件名
 */
const cssName = version >= '1.38' ? 'workbench.desktop.main.css' : 'workbench.main.css';

/**
 * 写背景图样式的外部css文件名
 */
const externalFileName = 'backgroundImageInfo.css';

/**
 * 获取vscode样式文件目录的Uri
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
 * 修改外部css文件的背景图属性
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
                return writeExternalCssFile(res[0]);
            }).then(() => {
                return setSourceCssImportInfo();
            }).then(() => {
                setBackgroundImageSuccess();
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
 * 校验外部设置背景样式css文件是否存在并且当前图片哈希码是否等于缓存中的哈希码
 * @returns 
 */
export function checExternalDataIsRight (): Promise<{modify:boolean}> {
    return new Promise((resolve, reject) => {
        getNowSettingCode().then(res => {
            if (res) {
                return checkCurentImageIsSame(res);
            } else {
                changeLoadState();
                resolve({modify:false});
                return;
            }
        }).then(data => {
            const state = data!.state;
            if (state === true) {
                // 当前不需要更新背景图css数据设置文件
                resolve({modify:false});
                return;
            }
            if (data && data.code) {
                // 编码校验失败或者没有css文件，重新写入
                return modifyCssFileForBackground(data.code);
            }
            return;
        }).then(() => {
            resolve({modify:true});
        }).catch(err => {
            reject(err);
        });
    });
}

/**
 * 将导入语句写入主样式文件中
 * @returns 
 */
export function setSourceCssImportInfo () : Promise<{modify:boolean}> {
    return new Promise((resolve, reject) => {
        try {
            getSourceCssFileContent().then(([content, uri]) => {
                return isSourceCssFileModify(content, uri);
            }).then((data) => {
                if (data === true) {
                    resolve({modify:false});
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
                resolve({modify:true});
            }).catch(err => {
                throw err;
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 检查指定code是否是当前设置背景图的code
 * @param codeValue 
 * @returns 如果state为false时也传了code，则此code是最新需要被设置的图片code码
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
                resolve({ state: false, code: codeValue });
            }).catch(err => {
                throw err;
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 设置当前背景哈希码的和是否设置背景的缓存数据
 * @param options 
 */
function settingConfiguration (options: info) {
    if (options) {
        backgroundImageConfiguration.setBackgroundNowImagePath(options.code);
        backgroundImageConfiguration.setBackgroundIsSetBackground(true);
    }
}

/**
 * 删除背景的缓存数据
*/
function deleteConfiguration () {
    backgroundImageConfiguration.setBackgroundNowImagePath("");
    backgroundImageConfiguration.setBackgroundIsSetBackground(false);
}

/**
 * 将背景样式写入外部样式文件
 * @param content 
 * @returns 
 */
function writeExternalCssFile (content: string): Promise<void> {
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
 * 获取外部css文件内容
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
 * 获取外部文件设置的背景样式字符串和相关信息，
 * 如果不需要更新数据即当前文件内的哈希码和需要设置的相同，则返回false
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
                const delay = 2; // 动画延迟的时间
                resolve([
                    `${importStart+'\n'
                    }/**${'\n'
                    }* vsCodeVersion [ ${version} ]${'\n'
                    }* extensionVersion [ ${extensionVer} ]${'\n'
                    }* date [ ${date} ]${'\n'
                    }* imageCode [ ${codeValue} ]${'\n'
                    }*/${'\n'
                    }@keyframes vscode-body-hide{from{background-size:0;}to{background-size:0;}}${'\n'
                    }@keyframes vscode-body-opacity{from{opacity:1;}to{opacity:${opacity};}}${'\n'
                    }body {${'\n'
                    }   opacity: ${opacity};${'\n'
                    }   background-repeat: no-repeat;${'\n'
                    }   background-size: cover;${'\n'
                    }   background-position: center;${'\n'
                    }   animation: vscode-body-hide 1s,vscode-body-opacity ${delay}s ease ${delay}s;${'\n'
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
 * 获取缓存中的当前设置的背景图哈希码数据，
 * 如果没有缓存数据，返回false
 * @returns 
 */
function getNowSettingCode (): Promise<string | false> {
    return new Promise((resolve, reject) => {
        try {
            const storageCode = backgroundImageConfiguration.getBackgroundNowImagePath();
            if (!storageCode) {
                resolve(false);
            } else {
                resolve(storageCode);
            }
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 获取vscode源样式文件内容，返回内容文本和路径uri
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
 * 校验源css文件是否已经被修改，即是否已经添加引入外部css文件的语句，
 * 是则返回true，可以跳过
 * @param content 
 * @param uri 
 * @returns 
 */
function isSourceCssFileModify (content: string, uri: Uri): Promise<{ content?:string, uri?:Uri } | true> {
    return new Promise((resolve, reject) => {
        try {
            const reg = content.match(new RegExp(findSourceCssPosition));
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
            const check = new RegExp(findImageCssPosition);
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
 * 生成获取外部文件注释信息的正则
 * @param name 
 * @returns 
 */
function getReg (name: string, catchData: boolean = true): string {
    if (catchData) return `${name}${s}\\[${s}(${asa})${s}\\]`;
    return `${name}${s}\\[${s}${asa}${s}\\]`;
}