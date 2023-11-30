/**
 * 修改css文件，修改部分包括vscode的源css文件和写入body背景样式的外部css文件
*/

import type { Disposable, Uri } from "vscode";
import type { ContentAndUri, info } from "../@types";
import { version } from "vscode";
import { dirname, join as pathjoin } from "path";
import { createExParamPromise, getDate } from "../../../utils";
import { createBuffer, createUri, isFileExits, newUri, readFileUri, uriDelete, writeFileUri } from "../../../common/file";
import { setStatusBarResolve } from "../../../common/interactive";
import { getNodeModulePath } from "../../../common/system";
import { reChecksum } from "../../../common/checksums";
import { BackgroundConfiguration } from "../../../workspace/background";
import { changeLoadState, getNewBackgroundOpacity, setBackgroundImageSuccess } from "../utils";
import { getVersion } from "../../../version";
import { WError, $rej } from "../../../error";
import { imageStoreUri } from "../store";


/**
 * 设置当前背景哈希码缓存，将是否设置背景状态值改为true
 * @param options 
 * @param random 是否是随机切换背景图方法内调用
 */
function settingConfiguration (options: info, random: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!options) {
            return resolve();
        }
        Promise.resolve(
            BackgroundConfiguration.setBackgroundIsSetBackground(true)
        ).then(() => {
            // 当不是随机切换时，将code存入当前图片缓存，否则存入随机切换图片缓存
            if (!random) {
                return Promise.resolve(
                    BackgroundConfiguration.setBackgroundNowImageCode(options.ImageCode)
                );
            }
            return Promise.resolve(
                BackgroundConfiguration.setBackgroundRandomCode(options.ImageCode)
            );
        }).then(() => {
            resolve();
        }).catch(err => {
            reject($rej(err, settingConfiguration.name));
        });
    });
}

/** 删除背景的缓存数据，将是否设置背景状态值改为false */
function deleteConfiguration (): Promise<void> {
    return new Promise((resolve, reject) => {
        Promise.resolve(
            BackgroundConfiguration.setBackgroundNowImageCode("")
        ).then(() => {
            return Promise.resolve(
                BackgroundConfiguration.setBackgroundIsSetBackground(false)
            );
        }).then(() => {
            resolve();
        }).catch(err => {
            reject($rej(err, deleteConfiguration.name));
        });
    });
}

/**
 * 获取vscode样式文件目录的Uri，没有指定name的文件就进行创建
 * @param name 指定文件名
 * @param create 没有文件是否创建
 */
function getCssUri (name: string, create: boolean = true): Promise<Uri | void> {
    return new Promise((resolve, reject) => {
        if (!name) {
            return resolve();
        }
        const modulePath = getNodeModulePath();
        if (!modulePath) {
            return reject(new WError('NodeModule is Undefined', {
                position: 'Function',
                FunctionName: getCssUri.name,
                description: 'Current Module is not main module. This data is needed to get Css File Path'
            }));
        }
        const uri = createUri(pathjoin(dirname(modulePath), 'vs', 'workbench', name));
        isFileExits(uri).then(res => {
            if (res) {
                // 有指定路径
                return Promise.reject({ jump: true, uri });
            }
            if (!create) {
                // 不创建文件，直接返回
                return Promise.reject({ jump: true });
            }
            return writeFileUri(uri, createBuffer(""));
        }).then(() => {
            resolve(uri);
        }).catch(err => {
            if (err.jump) {
                return resolve(err.uri??void 0);
            }
            reject($rej(err, getCssUri.name));
        });
    });
}

/**
 * 将背景样式写入外部样式文件
 * @param content css文本
 */
export function writeExternalCssFile (content: string): Promise<void> {
    return new Promise((resolve, reject) => {
        getCssUri(externalFileName).then(uri => {
            if (uri) {
                return writeFileUri(uri, createBuffer(content));
            }
        }).then(() => {
            resolve();
        }).catch(err => {
            reject($rej(err, writeExternalCssFile.name));
        });
    });
}

/** 获取外部css文件内容 */
export function getExternalFileContent (): Promise<[string, Uri]> {
    return new Promise((resolve, reject) => {
        // 获取指定路径uri，没有文件则创建
        getCssUri(externalFileName).then(uri => {
            return createExParamPromise(readFileUri(uri!), uri!);
        }).then(([content, uri]) => {
            resolve([content.toString(), uri]);
        }).catch(err => {
            reject($rej(err, getExternalFileContent.name));
        });
    });
}

/**
 * 获取外部文件设置的背景样式字符串和相关信息，
 * 如果不需要更新数据即当前文件内的哈希码和需要设置的相同，则返回false
 * @param codeValue 图片哈希码
 */
function getExternalCssContent (codeValue: string): Promise<[string, info] | false> {
    return new Promise((resolve, reject) => {
        const extensionVer = getVersion(), date = getDate();
        imageStoreUri().then(uri => {
            return createExParamPromise(getExternalFileContent(), uri);
        }).then(([content, uri]) => {
            return createExParamPromise(findInfo(content[0]), uri);
        }).then(([data, uri]) => {
            if (data) {
                const { ImageCode, VSCodeVersion, ExtensionVersion } = data;
                // 如果和上一次是一个哈希值，并且vscode和插件版本号相同，不再更新数据
                if (ImageCode === codeValue && VSCodeVersion === version && ExtensionVersion === extensionVer) {
                    return Promise.reject({ jump: true, data: false });
                }
            }
            return readFileUri(newUri(uri, `${codeValue}.back.wyg`));
        }).then(image => {
            const opacity = getNewBackgroundOpacity(BackgroundConfiguration.getBackgroundOpacity);
            const delay = 2; // 动画延迟的时间
            resolve([
                `${importStart+'\n'
                }/**${'\n'
                }* VSCodeVersion [ ${version} ]${'\n'
                }* ExtensionVersion [ ${extensionVer} ]${'\n'
                }* Date [ ${date} ]${'\n'
                }* ImageCode [ ${codeValue} ]${'\n'
                }*/${'\n'
                }@keyframes vscode-body-opacity-wyg{from{opacity:1;}to{opacity:${opacity};background-size: cover;}}${'\n'
                }body {${'\n'
                }   opacity: ${opacity};${'\n'
                }   background-repeat: no-repeat;${'\n'
                }   background-size: 0;${'\n'
                }   background-position: center;${'\n'
                }   animation: vscode-body-opacity-wyg 2s ease;${'\n'
                }   animation-delay: ${delay}s;${'\n'
                }   animation-fill-mode: forwards;${'\n'
                }   background-image: url('${image}');${'\n'
                }}${
                '\n'+importEnd}`,
                {
                    VSCodeVersion: version,
                    ExtensionVersion: extensionVer,
                    Date: date,
                    ImageCode: codeValue
                }
            ]);
        }).catch(err => {
            if (err.jump) {
                return resolve(err.data);
            }
            reject($rej(err, getExternalCssContent.name));
        });
    });
}

/** 获取缓存中的当前设置的背景图哈希码数据，如果没有缓存数据，返回false */
function getNowSettingCode (): Promise<string | false> {
    return new Promise((resolve, reject) => {
        Promise.resolve().then(() => {
            const storageCode = BackgroundConfiguration.getBackgroundNowImageCode;
            if (storageCode) {
                return resolve(storageCode);
            }
            resolve(false);
        }).catch(err => {
            reject($rej(err, getNowSettingCode.name));
        });
    });
}

/**
 * 获取vscode源样式文件内容，返回内容文本和路径uri
 * @returns 内容文本和路径uri
 */
function getSourceCssFileContent (): Promise<[string, Uri] | void> {
    return new Promise((resolve, reject) => {
        getCssUri(cssName, false).then(uri => {
            if (!uri) {
                return Promise.reject({ jump: true });
            }
            return createExParamPromise(readFileUri(uri), uri);
        }).then(([res, uri]) => {
            resolve([res!.toString(), uri]);
        }).catch(err => {
            if (err.jump) {
                return resolve();
            }
            reject($rej(err, getSourceCssFileContent.name));
        });
    });
}

/**
 * 校验源css文件是否已经被修改，即是否已经添加引入外部css文件的语句，是则返回true，可以跳过
 * @param content 
 * @param uri 
 */
function isSourceCssFileModify (content: string, uri: Uri): Promise<{ content:string, uri:Uri, exits:boolean }> {
    return new Promise((resolve, reject) => {
        Promise.resolve().then(() => {
            const reg = content.match(findSourceCssPositionRegexp);
            // 有匹配项返回，exits字段为true
            if (reg) {
                return resolve({ content, uri, exits: true });
            }
            resolve({ content, uri, exits: false });
        }).catch(err => {
            reject($rej(err, isSourceCssFileModify.name));
        });
    });
}

/**
 * 获取背景设置css文件的相关信息
 * @param content 
 */
function findInfo (content: string): Promise<info | false> {
    return new Promise((resolve, reject) => {
        Promise.resolve().then(() => {
            const reg = content.match(findExternalCssPositionRegexp);
            // 有匹配项返回信息
            if (reg) {
                return resolve({
                    VSCodeVersion: reg[1],
                    ExtensionVersion: reg[2],
                    Date: reg[3],
                    ImageCode: reg[4]
                });
            }
            resolve(false);
        }).catch(err => {
            reject($rej(err, findInfo.name));
        });
    });
}



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
            content = content.replace(findSourceCssPositionRegexp, "");
            resolve({content, uri});
        }).catch(err => {
            reject($rej(err, deleteContentByTagName.name));
        });
    });
}

/**
 * 获取外部css文件修改了透明度后的内容
 * @param content 被替换的文本
 * @param value 替换的透明度数据
 */
export function getExternalCssModifyOpacityContent (content: string, value: number): string {
    return content.replace(externalCssOpacityModifyRegexp, `$1${value}$3${value}$5`);
}