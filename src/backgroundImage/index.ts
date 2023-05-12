import { Uri, FileType } from "vscode";
import { delay, getHashCode } from "../utils";
import { createBuffer, imageToBase64, newUri, readDirectoryUri, readFileUri, uriDelete, writeFileUri } from "../utils/file";
import { selectFile, showProgress } from "../utils/interactive";
import { errHandle } from "../error";
import { backgroundImageConfiguration } from "../workspace/background";
import { changeLoadState, imageStoreUri, isChangeBackgroundImage, isWindowReloadToLoadBackimage, setBackgroundImageSuccess } from "./utils";
import { backgroundSendMessage } from "./execute";
import { checExternalDataIsRight, checkCurentImageIsSame, modifyCssFileForBackground, setSourceCssImportInfo } from "./modify";

// 图片类型过滤
const imageFilters = { 'Images': ['png', 'jpg', 'jpeg', 'gif', 'webp'] };

// 背景图片哈希码列表
const backgroundImageCodeList: string[] = [];

// 选择文件默认路径
var selectFileDefaultPath = backgroundImageConfiguration.getBackgroundSelectDefaultPath();

/**
 * 校验设置背景的css文件和源css文件是否删除相关内容
 */
export function checkImageCssDataIsRight (): Promise<boolean> {
    return new Promise((resolve, reject) => {
        let state = false;
        setSourceCssImportInfo().then((res) => {
            state = state || res.modify;
            return checExternalDataIsRight();
        }).then((res) => {
            state = state || res.modify;
            changeLoadState();
            resolve(state);
        }).catch(err => {
            reject(err);
        });
    });
}

/**
 * webview端点击设置背景图
 * @param param
 */
export function settingImage ({ code, index }: {
    code: string;
    index: number;
}) {
    isChangeBackgroundImage().then(() => {
        showProgress({
            location: 'Notification',
            title: '背景图设置中'
        }, (progress) => {
            return <Promise<void>>new Promise((resolve) => {
                modifyCssFileForBackground(code).then(() => {
                    backgroundSendMessage({
                        name: 'settingBackgroundSuccess',
                        value: index
                    });
                    progress.report({
                        message: '设置成功',
                        increment: 100
                    });
                    return delay(1000);
                }).then(() => {
                    isWindowReloadToLoadBackimage();
                    resolve();
                });
            });
        });
    }).catch((err) => {
        if (err) throw err;
    });
}

/**
 * 删除一张图片
 * @param messageSend 
 * @param webview 
 * @param code 
 */
export function deleteImage (code: string) {
    deleteFileStore(code).then(target => {
        backgroundSendMessage({
            name: 'deleteImageSuccess',
            value: target
        });
    }).catch(err => {
        errHandle(err as Error);
    });
}

/**
 * 侧栏选择背景图
 * @param messageSend 
 * @param webview 
 */
export function selectImage () {
    selectFile({
        many: true,
        files: true,
        filters: imageFilters,
        defaultUri: selectFileDefaultPath
    }).then(({ uri, dirName }) => {
        // 保存默认选择路径
        backgroundImageConfiguration.setBackgroundSelectDefaultPath(selectFileDefaultPath = dirName);
        return imageToBase64(uri[0].fsPath);
    }).then(base64 => {
        return createFileStore(base64);
    }).then(({ hashCode, base64 }) => {
        backgroundSendMessage({
            name: 'newImage',
            value: [base64, hashCode]
        });
    }).catch(err => {
        errHandle(err as Error);
    });
}

/**
 * 首次加载获取储存背景图片数据
 * @param messageSend 
 * @param webview 
 */
export function backgroundImageDataInit () {
    selectAllImage().then(({ files, uri }) => {
        return checkImageFile(files, uri);
    }).then(buffers => {
        return changeToString(buffers);
    }).then(str => {
        refreshGlobalBackgroundImageList();
        backgroundSendMessage({
            name: 'backgroundInitData',
            value: str
        });
        // 判断已选中的图片
        return checkCurentImageIsSame(backgroundImageConfiguration.getBackgroundNowImagePath());
    }).then(data => {
        if (data.state) {
            backgroundSendMessage({
                name: 'settingBackgroundSuccess',
                value: data.code as string
            });
            setBackgroundImageSuccess();
        }
    }).catch(err => {
        errHandle(err as Error);
    });
}

interface bufferAndCode {
    buffer:Uint8Array;
    code:string;
}

/**
 * 将读取的图片数据和哈希码一起返回
 * @param buffers 
 * @returns {Promise<string[][]>}
 */
function changeToString (buffers: bufferAndCode[]): Promise<string[][]> {
    return new Promise((resolve, reject) => {
        try {
            const result: string[][] = buffers.map(buff => {
                codeListRefresh(buff.code);
                return [buff.buffer.toString(), buff.code];
            });
            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
}

type codeChangeType = 'add' | 'delete';

/**
 * 对编码数据缓存数组进行操作
 * @param code 
 * @param state 
 */
function codeListRefresh (code: string, state: codeChangeType='add') {
    const index = backgroundImageCodeList.findIndex(item => item === code);
    if (state === 'add' && index < 0) {
        // 新增判断是否有重复值
        backgroundImageCodeList.push(code);
        backgroundImageConfiguration.setBackgroundAllImagePath(code);
    } else if (state === 'delete' && index >= 0) {
        // 删除判断是否存在索引
        backgroundImageCodeList.splice(index, 1);
        backgroundImageConfiguration.setBackgroundAllImagePath(code, 'delete');
    }
}

/**
 * 判断列表中是否含有此哈希码
 * @param code 
 * @returns {boolean}
 */
function hasHashCode (code: string): boolean {
    return backgroundImageCodeList.includes(code);
}

/**
 * 比较缓存数据和新数据是否相同并更新
 */
function refreshGlobalBackgroundImageList () {
    if (compareCodeList(
        backgroundImageConfiguration.getBackgroundAllImagePath(), 
        backgroundImageCodeList
    )) return;
    backgroundImageConfiguration.refreshBackgroundImagePath(backgroundImageCodeList)
}

/**
 * 和传入的列表进行比较
 */
function compareCodeList (oldData: string[], newData: string[]): boolean {
    if (oldData.length !== newData.length) return false;
    for (let i = 0; i < newData.length; i++) {
        const code = newData[i];
        const index = oldData.findIndex(item => item === code);
        if (index === -1) {
            return false;
        }
    }
    return true;
}

/**
 * 校验储存图片base64数据的文件并进行读取
 * @param files 
 * @param uri 
 * @returns {Promise<bufferAndCode[]>}
 */
function checkImageFile (files: [string, FileType][], uri: Uri): Promise<bufferAndCode[]> {
    return new Promise((resolve, reject) => {
        try {
            const fileRequest: Array<Promise<{ buffer: Uint8Array, code: string }>> = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i][0];
                // 对满足要求的文件进行文件数据读取
                const reg = file.match(/(.*?).back.wyg$/);
                if (reg) {
                    fileRequest.push(getFileAndCode(newUri(uri, file), reg[1]));
                }
            }
            Promise.all(fileRequest).then(res => {
                resolve(res);
            }).catch(err => {
                throw err;
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 返回图片文件的base64数据和哈希码
 * @param uri 
 * @param code 
 * @returns {Promise<bufferAndCode>}
 */
function getFileAndCode (uri: Uri, code: string): Promise<bufferAndCode> {
    return new Promise((resolve, reject) => {
        try {
            readFileUri(uri).then(res => {
                resolve({
                    buffer: res,
                    code
                });
            }).catch(err => {
                throw err;
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 获取背景图目录下的所有文件
 * @returns {Promise<{ files: [string, FileType][], uri: Uri }>}
 */
function selectAllImage (): Promise<{ files: [string, FileType][], uri: Uri }> {
    return new Promise((resolve, reject) => {
        try {
            const uri = imageStoreUri();
            if (!uri) throw new Error('null uri');
            readDirectoryUri(uri).then(res => {
                resolve({ files: res, uri });
            }).catch(err => {
                throw err;
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 生成一个没有重复的哈希码
 * @returns 
 */
function newHashCode (): string {
    let code = getHashCode();
    if (hasHashCode(code)) code = newHashCode();
    return code;
}

/**
 * 创建文件储存图片文件
 * @returns {Promise<{hashCode:string, base64:string}>}
 */
function createFileStore (base64: string): Promise<{hashCode:string, base64:string}> {
    return new Promise((resolve, reject) => {
        try {
            let uri = imageStoreUri();
            if (!uri) throw new Error('null uri');
            const code = newHashCode();
            uri = newUri(uri, code+'.back.wyg');
            writeFileUri(uri, createBuffer(base64)).then(() => {
                // 新增一个哈希码数据
                codeListRefresh(code);
                resolve({ hashCode: code, base64: base64 });
            }).catch(err => {
                throw err;
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 根据哈希码删除文件
 * @param code 
 * @returns {Promise<string>}
 */
function deleteFileStore (code: string): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            if (!hasHashCode(code)) throw new Error('null hash code');
            let uri = imageStoreUri();
            if (!uri) throw new Error('null uri');
            uri = newUri(uri, `${code}.back.wyg`);
            uriDelete(uri).then(() => {
                codeListRefresh(code, 'delete');
                resolve(code);
            }).catch(err => {
                throw err;
            });
        } catch (error) {
            reject(error);
        }
    });
}