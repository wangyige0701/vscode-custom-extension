/**
 * 修改css文件，修改部分包括vscode的源css文件和写入body背景样式的外部css文件
*/

import { version } from "vscode";
import type { Disposable, Uri } from "vscode";
import { dirname, join as pathjoin } from "path";
import { createExParamPromise, getDate } from "../../../utils";
import { createBuffer, createUri, isFileExits, newUri, readFileUri, uriDelete, writeFileUri } from "../../../common/file";
import { setStatusBarResolve } from "../../../common/interactive";
import { getNodeModulePath } from "../../../common/system";
import { reChecksum } from "../../../common/checksums";
import { BackgroundConfiguration } from "../../../workspace/background";
import { changeLoadState, getNewBackgroundOpacity, imageStoreUri, setBackgroundImageSuccess } from "../utils";
import { getVersion } from "../../../version";
import type { ContentAndUri, info } from "../types";
import { WError, $rej } from "../../../error";

/** vscode的源css文件名 */
const cssName = version >= '1.38' ? 'workbench.desktop.main.css' : 'workbench.main.css';

/** 写背景图样式的外部css文件名 */
const externalFileName = 'backgroundImageInfo.css';

/** 标签名 */
const tagName = 'wangyige.background'; 
/** 标签名正则 */
const tagNameReg = 'wangyige\\.background'; 
/** 开始标签 */
const importStart = `/* ${tagName}.start */`; 
/** 结束标签 */
const importEnd = `/* ${tagName}.end */`; 
/** 匹配开始标签正则 */
const importStartMatch = `\\/\\*\\s\*${tagNameReg}\\.start\\s\*\\*\\/`; 
/** 匹配结束标签正则 */
const importEndMatch = `\\/\\*\\s\*${tagNameReg}\\.end\\s\*\\*\\/`; 

/** 任意空格 */
const s = '\\s\*'; 
/** 任意字符 */
const a = '\[\\s\\S\]\*'; 
/** 任意字符不包括空格 */
const ans = '\\S\*'; 
/** 任意字符不包括换行 */
const ant = '\.\*'; 
/** 非空格开头非空格结尾，中间允许有空格，必须以非空格结尾 */
const asa = '\\S\*\.\*\\S\{1\,\}';
/** 任意数字 */
const n = '\\d\*'; 
/** 任意单词 */
const w = '\\w\*'; 
/** 任意单词和数字 */
const nw = '[\\d\\w]\*'; 

/** 匹配源及外部css文件修改内容标签范围正则字符串，捕获标签中的内容 */
const findSourceCssPosition = `${importStartMatch}(${a})${importEndMatch}`;
/** 匹配源及外部css文件修改内容标签范围，捕获标签中的内容的正则对象 */
const findSourceCssPositionRegexp = new RegExp(findSourceCssPosition);

/** 捕获源css文件引用文本中的问号后接内容 */
const findSourceCssVersionContent = `(${importStartMatch}${a}@import${s}url\\(${s}"${a}\\.css\\?)(${nw})("${s}\\);${a}${importEndMatch})`;
/** 捕获源css文件引用文本中的问号后接内容的正则对象 */
const findSourceCssVersionContentRegexp = new RegExp(findSourceCssVersionContent);

/** 匹配外部css文件并捕获注释信息正则字符串 */
const findExternalCssPosition = `${importStartMatch}${a}${
        getReg('VSCodeVersion')
    }${a}${
        getReg('ExtensionVersion')
    }${a}${
        getReg('Date')
    }${a}${
        getReg('ImageCode')
    }${a}${importEndMatch}`;
/** 匹配外部css文件并捕获注释信息的正则对象 */
const findExternalCssPositionRegexp = new RegExp(findExternalCssPosition);

/** 获取外部css文件中的透明度值正则字符串 */
const findExternalCssOpacityData = `${importStartMatch}${a}body${s}\{${a}opacity${s}\:${s}(${ans})${s};${a}\}${a}${importEndMatch}`;
/** 获取外部css文件中的透明度值的正则对象 */
const findExternalCssOpacityDataRegexp = new RegExp(findExternalCssOpacityData);

/** 对外部css文件的透明度进行修改的正则，包括动画样式内的透明度 */
const externalCssOpacityModify = `(${importStartMatch}${a}vscode-body-opacity-wyg${s}\{${a}to${s}\{${a
    }opacity${s}\:${s})(${ans})(${s};${a}\}${a}body${s}\{${a
    }opacity${s}\:${s})(${ans})(${s};${a}\}${a}${importEndMatch})`;
const externalCssOpacityModifyRegexp = new RegExp(externalCssOpacityModify);

/**
 * 修改外部css文件的背景图属性
 * @param code 图片的哈希码
 * @param random 是否为随机设置背景图状态
 * @param tip 是否需要显示提示文本
 */
export function modifyCssFileForBackground (code: string, random: boolean = false, tip: boolean = true): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!code) {
            return reject(new WError('Undefined Hash Code', {
                position: 'Parameter',
                FunctionName: modifyCssFileForBackground.name,
                ParameterName: 'code',
                description: 'The hash code to get image data is undefined'
            }));
        }
        let statusBarTarget: Disposable;
        getExternalCssContent(code).then(res => {
            if (res === false) {
                // 不需要更新，直接跳出
                return Promise.reject({ jump: true });
            }
            // 状态栏提示文字
            if (tip) {
                statusBarTarget = setStatusBarResolve({
                    icon: 'loading~spin',
                    message: `${random?'随机':''}背景图设置中`
                });
            }
            return createExParamPromise(writeExternalCssFile(res[0]), res[1]);
        }).then(([_, infoContent]) => {
            return settingConfiguration(infoContent, random);
        }).then(() => {
            return setSourceCssImportInfo();
        }).then(() => {
            statusBarTarget?.dispose();
            if (tip) {
                setBackgroundImageSuccess(`${random?'随机':''}背景图设置成功`);
            }
            resolve();
        }).catch(err => {
            // 传递了jump属性就resolve
            if (err.jump) {
                return resolve();
            }
            reject($rej(err, modifyCssFileForBackground.name));
        }).finally(() => {
            statusBarTarget?.dispose();
        });
    });
}

/** 删除外部和源css文件中背景图的相关设置内容 */
export function deleteBackgroundCssFileModification (): Promise<void> {
    return new Promise((resolve, reject) => {
        getSourceCssFileContent().then(data => {
            if (data) {
                // 删除源css文件
                return deleteContentByTagName(...data);
            }
        }).then(data => {
            if (data) {
                const { content, uri } = data!;
                return sourceCeeFileChangeChecksum(uri, createBuffer(content));
            }
        }).then(() => {
            // 删除外部css文件
            return getExternalFileContent();
        }).then(data => {
            return deleteContentByTagName(...data);
        }).then(({ content, uri }) => {
            return uriDelete(uri);
        }).then(() => {
            return deleteConfiguration();
        }).then(() => {
            setBackgroundImageSuccess("背景图配置删除成功");
            resolve();
        }).catch(err => {
            reject($rej(err, deleteBackgroundCssFileModification.name));
        });
    });
}

/** 校验外部设置背景样式css文件是否存在并且当前图片哈希码是否等于缓存中的哈希码 */
export function checExternalDataIsRight (): Promise<{modify:boolean}> {
    return new Promise((resolve, reject) => {
        getNowSettingCode().then(res => {
            if (res) {
                return checkCurentImageIsSame(res);
            }
            changeLoadState();
            return Promise.reject({ jump: true, modify: false });
        }).then(data => {
            if (data.state === true) {
                // 当前不需要更新背景图css数据设置文件
                return Promise.reject({ jump: true, modify: false });
            }
            if (data.code) {
                // 哈希码校验失败或者没有css文件，重新写入
                return modifyCssFileForBackground(data.code);
            }
            return Promise.reject({ jump: true, modify: true });
        }).then(() => {
            resolve({ modify:true });
        }).catch(err => {
            if (err.jump) {
                return resolve({ modify: err.modify });
            }
            reject($rej(err, checExternalDataIsRight.name));
        });
    });
}

/**
 * 将导入语句写入主样式文件中
 * @param init 是否是初始化调用，初始化调用此方法为校验，不需要进行文件修改
 */
export function setSourceCssImportInfo (init: boolean = false) : Promise<{modify:boolean}> {
    return new Promise((resolve, reject) => {
        getSourceCssFileContent().then(data => {
            if (data) {
                // 有数据，进行修改
                return isSourceCssFileModify(...data);
            }
            // 没有数据返回false
            return Promise.reject({ jump: true, modify: false });
        }).then(({ content, uri, exits }) => {
            const nowDate = Date.now();
            let resContent: Buffer;
            if (exits === true) {
                // 修改过源文件需要更换路径后的时间戳，去除缓存
                if (init) {
                    // 源文件满足修改格式并且当前是初始化校验调用，则不进行文件改写并且通知外部函数当前未修改
                    return Promise.reject({ jump: true, modify: false });
                }
                // 不是初始化校验更新时间戳
                resContent = createBuffer(content.replace(findSourceCssVersionContentRegexp, `$1${nowDate}$3`));
            } else {
                // 没有修改过源文件直接修改
                resContent = createBuffer(`${importStart+'\n'
                    }@import url("./${externalFileName}?${nowDate}");${
                    '\n'+importEnd}`+content);
            }
            // 修改源文件并重置校验和
            return sourceCeeFileChangeChecksum(uri, resContent);
        }).then(() => {
            resolve({ modify: true });
        }).catch(err => {
            if (err.jump) {
                return resolve({ modify: err.modify });
            }
            reject($rej(err, setSourceCssImportInfo.name));
        });
    });
}

/**
 * 源css文件修改后重置校验和数据
 * @param uri 源文件的uri数据
 */
function sourceCeeFileChangeChecksum (uri: Uri, content: Uint8Array): Promise<void> {
    return new Promise((resolve, reject) => {
        writeFileUri(uri, content).then(() => {
            return reChecksum(uri);
        }).then(() => {
            resolve();
        }).catch(err => {
            reject($rej(err, sourceCeeFileChangeChecksum.name));
        });
    });
}

/**
 * 检查指定code是否是当前设置背景图的code
 * @param codeValue 
 * @returns 如果state为false时也传了code，则此code是最新需要被设置的图片哈希码
 */
export function checkCurentImageIsSame (codeValue: string): Promise<{ state:boolean, code?:string }> {
    return new Promise((resolve, reject) => {
        Promise.resolve(<Promise<void>>new Promise(($resolve, $reject) => {
            if (!codeValue) {
                return $reject({ jump: true, state: false });
            }
            $resolve();
        })).then(() => {
            return getExternalFileContent();
        }).then(content => {
            return findInfo(content[0]);
        }).then(data => {
            if (data) {
                const { ImageCode } = data;
                // 如果和上一次是一个哈希值，不再更新数据
                if (ImageCode === codeValue) {
                    return Promise.reject({ jump: true, state: true, code: ImageCode });
                }
            }
            resolve({ state: false, code: codeValue });
        }).catch(err => {
            if (err.jump) {
                return resolve({ state: err.state, code: err.code??void 0 });
            }
            reject($rej(err, checkCurentImageIsSame.name));
        });
    });
}

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
 * 生成获取外部文件注释信息的正则
 * @param name 
 * @param catchData 是否需要捕获对应数据
 */
function getReg (name: string, catchData: boolean = true): string {
    if (catchData) {
        return `${name}${s}\\[${s}(${asa})${s}\\]`;
    }
    return `${name}${s}\\[${s}${asa}${s}\\]`;
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