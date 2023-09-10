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
 */
export function joinPathUri (uri: Uri, ...name: string[]): Uri {
    return Uri.joinPath(uri, ...name);
}

/**
 * 根据路径创建一个Uri
 * @param path 
 */
export function createUri (path: string): Uri {
    return Uri.file(path);
}

/**
 * 将给定路径转换为相对于vscode的资源路径
 * @param path 
 */
export function pathToVscode (path: string): Uri {
    return Uri.file(path).with({ scheme: 'vscode-resource' });
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
        workspace.fs.copy(source, target, options).then(res => {
            resolve(res);
        }, err => {
            reject(new Error('workspace.fs.copy', { cause: err }));
        });
    });
}

/**
 * 删除指定uri文件
 * @param uri 
 * @param options 
 */
export function uriDelete (uri: Uri, options?: { 
    recursive?: boolean | undefined, 
    useTrash?: boolean | undefined 
} | undefined): Promise<void> {
    return new Promise((resolve, reject) => {
        workspace.fs.delete(uri, options).then(res => {
            resolve(res);
        }, err => {
            reject(new Error('workspace.fs.delete', { cause: err }));
        });
    });
}

/**
 * 查看文件夹内容
 * @param uri 
 */
export function readDirectoryUri (uri: Uri): Promise<[string, FileType][]> {
    return new Promise((resolve, reject) => {
        workspace.fs.readDirectory(uri).then(res => {
            resolve(res);
        }, err => {
            reject(new Error('workspace.fs.readDirectory', { cause: err }));
        });
    });
}

/**
 * 创建文件夹
 * @param uri 
 */
export function createDirectoryUri (uri: Uri): Promise<Uri> {
    return new Promise((resolve, reject) => {
        workspace.fs.createDirectory(uri).then(() => {
            resolve(uri);
        }, err => {
            reject(new Error('workspace.fs.createDirectory', { cause: err }));
        });
    });
}

/**
 * 查看文件内容
 * @param uri 
 */
export function readFileUri (uri: Uri): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        workspace.fs.readFile(uri).then(res => {
            resolve(res);
        }, err => {
            reject(new Error('workspace.fs.readFile', { cause: err }));
        });
    });
}

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
 * 写文件
 * @param uri 
 * @param content 
 */
export function writeFileUri (uri: Uri, content: Uint8Array): Promise<void> {
    return new Promise((resolve, reject) => {
        workspace.fs.writeFile(uri, content).then(res => {
            resolve(res);
        }, err => {
            reject(new Error('workspace.fs.writeFile', { cause: err }));
        });
    });
}

/**
 * 查看对应uri信息
 * @param uri 
 */
export function uriStat (uri: Uri): Promise<FileStat> {
    return new Promise((resolve, reject) => {
        workspace.fs.stat(uri).then(res => {
            resolve(res);
        }, err => {
            reject(new Error('workspace.fs.stat', { cause: err }));
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