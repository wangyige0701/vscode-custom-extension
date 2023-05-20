import { FileStat, FileType, Uri, workspace } from 'vscode';
import { posix, extname, resolve as pathResolve } from 'path';
import { isString } from '..';
import { existsSync } from 'fs';

/**
 * 生成新uri
 * @param uri 当前uri
 * @param path 新路径
 * @returns 根据新路径生成的新uri
 */
export function newUri (uri: Uri, ...path: string[]): Uri {
    return uri.with({ path: posix.join(uri.fsPath, ...path) });
}

/**
 * 根据base uri拼接路径
 * @param uri 
 * @param name 
 * @returns 
 */
export function joinPathUri (uri: Uri, ...name: string[]): Uri {
    return Uri.joinPath(uri, ...name);
}

/**
 * 将给定路径转换为相对于vscode的资源路径
 * @param path 
 * @returns 
 */
export function pathToVscode (path: string): string {
    return Uri.file(path).with({ scheme: 'vscode-resource' }).toString();
}

/**
 * 生成unit8数据
 * @param content
 * @returns buffer流
 */
export function createBuffer (content: string | Uint8Array | readonly number[]): Buffer {
    return Buffer.from(content);
}

/**
 * 复制文件
 * @param source 
 * @param target 
 * @param options 
 */
export function uriCopy (source: Uri, target: Uri, options?: { overwrite?: boolean | undefined } | undefined): Promise<void> {
    return new Promise((resolve, reject) => {
        try {
            workspace.fs.copy(source, target, options).then(res => {
                resolve(res);
            }, err => {
                reject(err);
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 删除指定uri文件
 * @param uri 
 * @param options 
 * @returns 
 */
export function uriDelete (uri: Uri, options?: { 
    recursive?: boolean | undefined, 
    useTrash?: boolean | undefined 
} | undefined): Promise<void> {
    return new Promise((resolve, reject) => {
        try {
            workspace.fs.delete(uri, options).then(res => {
                resolve(res);
            }, err => {
                reject(err);
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 查看文件夹内容
 * @param uri 
 * @returns 
 */
export function readDirectoryUri (uri: Uri): Promise<[string, FileType][]> {
    return new Promise((resolve, reject) => {
        try {
            workspace.fs.readDirectory(uri).then(res => {
                resolve(res);
            }, err => {
                reject(err);
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 创建文件夹
 * @param uri 
 * @returns 
 */
export function createDirectoryUri (uri: Uri): Promise<Uri> {
    return new Promise((resolve, reject) => {
        try {
            workspace.fs.createDirectory(uri).then(() => {
                resolve(uri);
            }, err => {
                reject(err);
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 查看文件内容
 * @param uri 
 * @returns 
 */
export function readFileUri (uri: Uri): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        try {
            workspace.fs.readFile(uri).then(res => {
                resolve(res);
            }, err => {
                reject(err);
            });
        } catch (error) {
            reject(error);
        }
    });
}

export function readFileUriList (uri: Uri[]): Promise<Uint8Array[]> {
    return new Promise((resolve, reject) => {
        const list: Promise<Uint8Array>[] = [];
        uri.forEach(item => {
            list.push(readFileUri(item));
        });
        Promise.all(list).then(res => {
            resolve(res);
        }).catch(err => {
            reject(err);
        });
    });
}

/**
 * 写文件
 * @param uri 
 * @param content 
 * @returns 
 */
export function writeFileUri (uri: Uri, content: Uint8Array): Promise<void> {
    return new Promise((resolve, reject) => {
        try {
            workspace.fs.writeFile(uri, content).then(res => {
                resolve(res);
            }, err => {
                reject(err);
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 查看对应uri信息
 * @param uri 
 * @returns 
 */
export function uriStat (uri: Uri): Promise<FileStat> {
    return new Promise((resolve, reject) => {
        try {
            workspace.fs.stat(uri).then(res => {
                resolve(res);
            }, err => {
                reject(err);
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 判断指定路径是否存在
 * @param data 路径uri或者字符串
 * @returns 
 */
export function isFileExits (data: Uri | string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        try {
            if (!isString(data)) {
                data = data.fsPath;
            }
            resolve(existsSync(data));
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 将本地图片转为base64编码
 * @param path 
 * @returns 
 */
export function imageToBase64 (path: string): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            readFileUri(Uri.file(pathResolve(path))).then(content => {
                const fileType = imageToBase64Type(extname(path).substring(1));
                return base64ByFiletypeAndData('image', fileType, content);
            }).then(data => {
                resolve(data);
            }).catch(err => {
                reject(err);
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 根据类型、文件类型、数据合成base64
 * @param type 
 * @param fileType 
 * @param data 
 * @returns 
 */
export function base64ByFiletypeAndData (type: string, fileType: string, data: string | Uint8Array | readonly number[]): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            resolve(`data:${type}/${fileType};base64,${createBuffer(data).toString('base64')}`);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 部分图片格式转换
 * @param fileType 
 * @returns 
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