/**
 * 修改css文件，修改部分包括vscode的源css文件和写入body背景样式的外部css文件
*/

import { dirname, join } from "path";
import { getDate } from "../utils";
import { createBuffer, isFileExits, newUri, readFileUri, uriDelete, writeFileUri } from "../utils/file";
import { backgroundImageConfiguration } from "../workspace/background";
import { Disposable, Uri, version } from "vscode";
import { 
    changeLoadState, 
    getNewBackgroundOpacity, 
    imageStoreUri, 
    isWindowReloadToLoadBackimage, 
    setBackgroundImageSuccess 
} from "./utils";
import { getVersion } from "../version";
import { ContentAndUri, info } from "./type";
import { setStatusBarResolve } from "../utils/interactive";
import { WError, promiseReject } from "../error";

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
const asa = '\\S\*\.\*\\S\{1\,\}' 
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
const findSourceCssVersionContent = 
    `(${importStartMatch}${a}@import${s}url\\(${s}"${a}\\.css\\?)(${nw})("${s}\\);${a}${importEndMatch})`;
/** 捕获源css文件引用文本中的问号后接内容的正则对象 */
const findSourceCssVersionContentRegexp = new RegExp(findSourceCssVersionContent);

/** 匹配外部css文件并捕获注释信息正则字符串 */
const findExternalCssPosition = 
    `${importStartMatch}${a}${
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
const findExternalCssOpacityData = 
    `${importStartMatch}${a}body${s}\{${a}opacity${s}\:${s}(${ans})${s};${a}\}${a}${importEndMatch}`;
/** 获取外部css文件中的透明度值的正则对象 */
const findExternalCssOpacityDataRegexp = new RegExp(findExternalCssOpacityData);

/** 对外部css文件的透明度进行修改的正则，包括动画样式内的透明度 */
const externalCssOpacityModify = 
    `(${importStartMatch}${a}vscode-body-opacity-wyg${s}\{${a}to${s}\{${a
    }opacity${s}\:${s})(${ans})(${s};${a}\}${a}body${s}\{${a
    }opacity${s}\:${s})(${ans})(${s};${a}\}${a}${importEndMatch})`;
const externalCssOpacityModifyRegexp = new RegExp(externalCssOpacityModify);

/**
 * 修改外部css文件的背景图属性
 * @param codeValue 图片的哈希码
 * @param random 是否为随机设置背景图状态
 * @param tip 是否需要显示提示文本
 */
export function modifyCssFileForBackground (codeValue: string, random: boolean = false, tip: boolean = true): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!codeValue) {
            reject(new WError('Undefined Hash Code', {
                position: 'Parameter',
                FunctionName: 'modifyCssFileForBackground',
                ParameterName: 'codeValue',
                description: 'The hash code to get image data is undefined'
            }));
            return;
        }
        let infoContent: info | undefined;
        let statusBarTarget: Disposable | null;
        getExternalCssContent(codeValue).then(res => {
            if (res === false) {
                // 不需要更新，直接跳出
                throw { jump: true };
            }
            infoContent = res[1];
            // 状态栏提示文字
            if (tip) statusBarTarget = setStatusBarResolve({
                icon: 'loading~spin',
                message: `${random?'随机':''}背景图设置中`
            });
            return writeExternalCssFile(res[0]);
        }).then(() => {
            return settingConfiguration(infoContent!, random);
        }).then(() => {
            return setSourceCssImportInfo();
        }).then(() => {
            statusBarTarget?.dispose();
            if (tip) setBackgroundImageSuccess(`${random?'随机':''}背景图设置成功`);
            resolve();
        }).catch(err => {
            // 传递了jump属性就resolve
            if (err.jump) {
                resolve();
            } else {
                reject(promiseReject(err, 'modifyCssFileForBackground'));
            }
        }).finally(() => {
            statusBarTarget?.dispose();
            statusBarTarget = null;
        });
    });
}

/** 删除外部和源css文件中背景图的相关设置内容 */
export function deletebackgroundCssFileModification (): Promise<void> {
    return new Promise((resolve, reject) => {
        getSourceCssFileContent().then(data => {
            if (data) {
                // 删除源css文件
                return deleteContentByTagName(...data);
            }
        }).then(data => {
            if (data) {
                const { content, uri } = data!;
                return writeFileUri(uri, createBuffer(content));
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
            isWindowReloadToLoadBackimage("背景图配置删除成功，是否重启窗口");
            resolve();
        }).catch(err => {
            reject(promiseReject(err, 'deletebackgroundCssFileModification'));
        });
    });
}

/** 校验外部设置背景样式css文件是否存在并且当前图片哈希码是否等于缓存中的哈希码 */
export function checExternalDataIsRight (): Promise<{modify:boolean}> {
    return new Promise((resolve, reject) => {
        getNowSettingCode().then(res => {
            if (res) {
                return checkCurentImageIsSame(res);
            } else {
                changeLoadState();
                throw { jump: true, modify: false };
            }
        }).then(data => {
            const state = data!.state;
            if (state === true) {
                // 当前不需要更新背景图css数据设置文件
                throw { jump: true, modify: false };
            }
            if (data && data.code) {
                // 哈希码校验失败或者没有css文件，重新写入
                return modifyCssFileForBackground(data.code);
            } else {
                throw { jump: true, modify: true };
            }
        }).then(() => {
            resolve({ modify:true });
        }).catch(err => {
            if (err.jump) {
                resolve({ modify: err.modify });
            } else {
                reject(promiseReject(err, 'checExternalDataIsRight'));
            }
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
            } else {
                // 没有数据返回false
                throw { jump: true, modify: false };
            }
        }).then(({ content, uri, exits }) => {
            const nowDate = Date.now();
            let resContent: Buffer;
            if (exits === true) {
                // 修改过源文件需要更换路径后的时间戳，去除缓存
                if (!init) {
                    resContent = createBuffer(content.replace(findSourceCssVersionContentRegexp, `$1${nowDate}$3`));
                } else {
                    // 源文件满足修改格式并且当前是初始化校验调用，则不进行文件改写并且通知外部函数当前未修改
                    throw { jump: true, modify: false };
                }
            } else {
                // 没有修改过源文件直接修改
                resContent = createBuffer(`${importStart+'\n'
                    }@import url("./${externalFileName}?${nowDate}");${
                    '\n'+importEnd}`+content);
            }
            return writeFileUri(uri, resContent);
        }).then(() => {
            resolve({ modify: true });
        }).catch(err => {
            if (err.jump) {
                resolve({ modify: err.modify });
            } else {
                reject(promiseReject(err, 'setSourceCssImportInfo'));
            }
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
        Promise.resolve(<Promise<void>>new Promise(resolve => {
            if (!codeValue) {
                throw { jump: true, state: false };
            } else {
                resolve();
            }
        })).then(() => {
            return getExternalFileContent();
        }).then(content => {
            return findInfo(content[0]);
        }).then(data => {
            if (data) {
                const { ImageCode } = data;
                // 如果和上一次是一个哈希值，不再更新数据
                if (ImageCode === codeValue) {
                    throw { jump: true, state: true, code: ImageCode };
                }
            }
            resolve({ state: false, code: codeValue });
        }).catch(err => {
            if (err.jump) {
                resolve({ state: err.state, code: err.code??undefined });
            } else {
                reject(promiseReject(err, 'checkCurentImageIsSame'));
            }
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
            resolve();
            return;
        }
        Promise.resolve(
            backgroundImageConfiguration.setBackgroundIsSetBackground(true)
        ).then(() => {
            // 当不是随机切换时，将code存入当前图片缓存，否则存入随机切换图片缓存
            if (!random) {
                return Promise.resolve(
                    backgroundImageConfiguration.setBackgroundNowImageCode(options.ImageCode)
                );
            }
            return Promise.resolve(
                backgroundImageConfiguration.setBackgroundRandomCode(options.ImageCode)
            );
        }).then(() => {
            resolve();
        }).catch(err => {
            reject(promiseReject(err, 'settingConfiguration'));
        });
    });
}

/** 删除背景的缓存数据，将是否设置背景状态值改为false */
function deleteConfiguration (): Promise<void> {
    return new Promise((resolve, reject) => {
        Promise.resolve(
            backgroundImageConfiguration.setBackgroundNowImageCode("")
        ).then(() => {
            return Promise.resolve(
                backgroundImageConfiguration.setBackgroundIsSetBackground(false)
            );
        }).then(() => {
            resolve();
        }).catch(err => {
            reject(promiseReject(err, 'deleteConfiguration'));
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
            resolve();
            return;
        }
        const module = require.main;
        if (!module) {
            throw new WError('NodeModule is Undefined', {
                position: 'Function',
                FunctionName: 'getCssUri',
                description: 'The main property from require is undefined. This data is used to get Css File Path'
            });
        }
        const uri = Uri.file(join(dirname(module.filename), 'vs', 'workbench', name));
        isFileExits(uri).then(res => {
            if (res) {
                // 有指定路径
                throw { jump: true, uri };
            }
            if (!create) {
                // 不创建文件，直接返回
                throw { jump: true };
            }
            return writeFileUri(uri, createBuffer(""));
        }).then(() => {
            resolve(uri);
        }).catch(err => {
            if (err.jump) {
                if (err.uri) {
                    resolve(err.uri);
                } else {
                    resolve();
                }
            } else {
                reject(promiseReject(err, 'getCssUri'));
            }
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
            reject(promiseReject(err, 'writeExternalCssFile'));
        });
    });
}

/** 获取外部css文件内容 */
export function getExternalFileContent (): Promise<[string, Uri]> {
    return new Promise((resolve, reject) => {
        let uriValue: Uri;
        // 获取指定路径uri，没有文件则创建
        getCssUri(externalFileName).then(uri => {
            uriValue = uri!;
            return readFileUri(uri!);
        }).then(content => {
            resolve([content.toString(), uriValue]);
        }).catch(err => {
            reject(promiseReject(err, 'getExternalFileContent'));
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
        let imageUri: Uri;
        const extensionVer = getVersion(),
        date = getDate();
        imageStoreUri().then(uri => {
            if (!uri) {
                throw new WError('Undefined Uri', {
                    position: 'Parameter',
                    FunctionName: 'getExternalCssContent > imageStoreUri',
                    ParameterName: 'uri',
                    description: 'The Uri of image folder is undefined'
                });
            }
            imageUri = uri;
            return getExternalFileContent();
        }).then(content => {
            return findInfo(content[0]);
        }).then(data => {
            if (data) {
                const { ImageCode, VSCodeVersion, ExtensionVersion } = data;
                // 如果和上一次是一个哈希值，并且vscode和插件版本号相同，不再更新数据
                if (ImageCode === codeValue && VSCodeVersion === version && ExtensionVersion === extensionVer) {
                    throw { jump: true, data: false };
                }
            }
            return readFileUri(newUri(imageUri, `${codeValue}.back.wyg`));
        }).then(image => {
            const opacity = getNewBackgroundOpacity(backgroundImageConfiguration.getBackgroundOpacity());
            const delay = 2; // 动画延迟的时间
            resolve([
                `${importStart+'\n'
                }/**${'\n'
                }* VSCodeVersion [ ${version} ]${'\n'
                }* ExtensionVersion [ ${extensionVer} ]${'\n'
                }* Date [ ${date} ]${'\n'
                }* ImageCode [ ${codeValue} ]${'\n'
                }*/${'\n'
                }@keyframes vscode-body-hide-wyg{from{background-size:0;}to{background-size:0;}}${'\n'
                }@keyframes vscode-body-opacity-wyg{from{opacity:1;}to{opacity:${opacity};}}${'\n'
                }body {${'\n'
                }   opacity: ${opacity};${'\n'
                }   background-repeat: no-repeat;${'\n'
                }   background-size: cover;${'\n'
                }   background-position: center;${'\n'
                }   animation: vscode-body-hide-wyg ${delay}s,vscode-body-opacity-wyg 2s ease ${delay}s;${'\n'
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
                resolve(err.data);
            } else {
                reject(promiseReject(err, 'getExternalCssContent'));
            }
        });
    });
}

/** 获取缓存中的当前设置的背景图哈希码数据，如果没有缓存数据，返回false */
function getNowSettingCode (): Promise<string | false> {
    return new Promise((resolve, reject) => {
        try {
            const storageCode = backgroundImageConfiguration.getBackgroundNowImageCode();
            if (!storageCode) {
                resolve(false);
            } else {
                resolve(storageCode);
            }
        } catch (error) {
            reject(promiseReject(error, 'getNowSettingCode'));
        }
    });
}

/**
 * 获取vscode源样式文件内容，返回内容文本和路径uri
 * @returns 内容文本和路径uri
 */
function getSourceCssFileContent (): Promise<[string, Uri] | void> {
    return new Promise((resolve, reject) => {
        let uriValue: Uri;
        getCssUri(cssName, false).then(uri => {
            if (!uri) {
                throw { jump: true };
            }
            uriValue = uri;
            return readFileUri(uri);
        }).then(res => {
            resolve([res!.toString(), uriValue]);
        }).catch(err => {
            if (err.jump) {
                resolve();
            } else {
                reject(promiseReject(err, 'getSourceCssFileContent'));
            }
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
        try {
            const reg = content.match(findSourceCssPositionRegexp);
            // 有匹配项返回，exits字段为true
            if (reg) {
                resolve({ content, uri, exits: true });
            } else {
                resolve({ content, uri, exits: false })
            }
        } catch (error) {
            reject(promiseReject(error, 'isSourceCssFileModify'));
        }
    });
}

/**
 * 获取背景设置css文件的相关信息
 * @param content 
 */
function findInfo (content: string): Promise<info | false> {
    return new Promise((resolve, reject) => {
        try {
            const reg = content.match(findExternalCssPositionRegexp);
            // 有匹配项返回信息
            if (reg) {
                resolve({
                    VSCodeVersion: reg[1],
                    ExtensionVersion: reg[2],
                    Date: reg[3],
                    ImageCode: reg[4]
                });
            } else {
                resolve(false);
            }
        } catch (error) {
            reject(promiseReject(error, 'findInfo'));
        }
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
        try {
            if (!content) {
                resolve({content:"", uri});
                return;
            }
            content = content.replace(findSourceCssPositionRegexp, "");
            resolve({content, uri});
        } catch (error) {
            reject(promiseReject(error, 'deleteContentByTagName'));
        }
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