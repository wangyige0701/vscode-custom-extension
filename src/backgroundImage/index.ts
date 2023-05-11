import { Uri, Webview, FileType } from "vscode";
import { MessageSend } from "../utils/webview/main";
import { getHashCode } from "../utils";
import { createBuffer, imageToBase64, newUri, readDirectoryUri, readFileUri, uriDelete, writeFileUri } from "../utils/file";
import { selectFile } from "../utils/interactive";
import { errHandle } from "../error";
import { backgroundImageConfiguration } from "../workspace/background";
import { imageStoreUri } from "./utils";

// 图片类型过滤
const imageFilters = { 'Images': ['png', 'jpg', 'jpeg', 'gif', 'webp'] };

// 背景图片哈希码列表
const backgroundImageCodeList: string[] = [];

// 选择文件默认路径
var selectFileDefaultPath = backgroundImageConfiguration.getBackgroundSelectDefaultPath();

/**
 * 删除一张图片
 * @param messageSend 
 * @param webview 
 * @param code 
 */
export function deleteImage (messageSend: MessageSend, webview: Webview, code: string) {
    deleteFileStore(code).then(target => {
        messageSend(webview, {
            group: 'background',
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
export function selectImage (messageSend: MessageSend, webview: Webview) {
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
        messageSend(webview, {
            group: 'background',
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
export function backgroundImageDataInit (messageSend: MessageSend, webview: Webview) {
    selectAllImage().then(({ files, uri }) => {
        return checkImageFile(files, uri);
    }).then(buffers => {
        return changeToString(buffers);
    }).then(str => {
        refreshGlobalBackgroundImageList();
        messageSend(webview, {
            group: 'background',
            name: 'backgroundInitData',
            value: str
        });
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
 * 校验文件并进行数据读取
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
            });
        } catch (error) {
            reject(error);
        }
    });
}