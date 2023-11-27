import { Uri } from "vscode";
import { existsSync } from "fs";
import { extname, resolve as pathResolve } from 'path';
import { readFileUri, createBuffer } from "./main";
import { isString } from "../../utils";

/**
 * 传递数组查询多个文件内容
 * @param uri 
 */
export function readFileUriList (uri: Uri[]): Promise<Uint8Array[]> {
    return new Promise((resolve, reject) => {
        const list: Promise<Uint8Array>[] = [];
        uri.forEach(item => {
            list.push(readFileUri(item));
        });
        Promise.all(list).then(res => {
            resolve(res);
        }).catch(err => {
            reject(new Error('Error on readFile by list', { cause: err }));
        });
    });
}

/**
 * 判断指定路径是否存在
 * @param data 路径uri或者字符串
 */
export function isFileExits (data: Uri | string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        try {
            if (!isString(data)) {
                data = data.fsPath;
            }
            resolve(existsSync(data));
        } catch (error) {
            reject(new Error('Error when use existsSync', { cause: error }));
        }
    });
}

/**
 * 同步判断路径是否存在
 */
export function isFileExitsSync (data: Uri | string): boolean {
    if (!isString(data)) {
        data = data.fsPath;
    }
    return existsSync(data);
}

/**
 * 将本地图片转为base64编码
 * @param path 
 */
export function imageToBase64 (path: string): Promise<string> {
    return new Promise((resolve, reject) => {
        readFileUri(Uri.file(pathResolve(path))).then(content => {
            const fileType = imageToBase64Type(extname(path).substring(1));
            return base64ByFiletypeAndData('image', fileType, content);
        }).then(data => {
            resolve(data);
        }).catch(err => {
            reject(new Error('Error when change Image to Base64 Data', { cause: err }));
        });
    });
}

/**
 * 根据类型、文件类型、数据合成base64
 * @param type 
 * @param fileType 
 * @param data 
 */
export function base64ByFiletypeAndData (type: string, fileType: string, data: string | Uint8Array | Buffer | readonly number[]): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            if (data instanceof Buffer) {
                return resolve(`data:${type}/${fileType};base64,${data.toString('base64')}`);
            }
            resolve(`data:${type}/${fileType};base64,${createBuffer(data).toString('base64')}`);
        } catch (error) {
            reject(new Error('Error when Merge Base64 Data', { cause: error }));
        }
    });
}

/**
 * 部分图片格式转换
 * @param fileType 
 */
export function imageToBase64Type (fileType: string) {
    if (fileType === 'jpg' || fileType === 'webp') {
        fileType = 'jpeg';
    } else if (fileType === 'ico') {
        fileType = 'x-icon';
    } else if (fileType === 'svg') {
        fileType = 'svg+xml';
    }
    return fileType;
}