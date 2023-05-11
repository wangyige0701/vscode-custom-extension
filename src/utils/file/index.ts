import { FileStat, FileType, Uri, workspace } from 'vscode';
import { posix, extname, resolve as pathResolve } from 'path';
import { readFileSync } from 'fs';

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
 * @param content 输入的文本内容
 * @returns buffer流
 */
export function createBuffer (content: string): Buffer {
    return Buffer.from(content);
}

/**
 * 复制文件
 * @param source 
 * @param target 
 * @param options 
 */
export function uriCopy (source: Uri, target: Uri, options?: { overwrite?: boolean | undefined } | undefined): Thenable<void> {
    return workspace.fs.copy(source, target, options);
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
} | undefined): Thenable<void> {
    return workspace.fs.delete(uri, options);
}

/**
 * 查看文件夹内容
 * @param uri 
 * @returns 
 */
export function readDirectoryUri (uri: Uri): Thenable<[string, FileType][]> {
    return workspace.fs.readDirectory(uri);
}

/**
 * 查看文件内容
 * @param uri 
 * @returns 
 */
export function readFileUri (uri: Uri): Thenable<Uint8Array> {
    return workspace.fs.readFile(uri);
}

export function readFileUriList (uri: Uri[]): Promise<Uint8Array[]> {
    return new Promise((resolve, reject) => {
        const list: Thenable<Uint8Array>[] = [];
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
export function writeFileUri (uri: Uri, content: Uint8Array): Thenable<void> {
    return workspace.fs.writeFile(uri, content);
}

/**
 * 查看对应uri信息
 * @param uri 
 * @returns 
 */
export function uriStat (uri: Uri): Thenable<FileStat> {
    return workspace.fs.stat(uri);
}

/**
 * 将图片转为base64编码
 * @param path 
 * @returns 
 */
export function imageToBase64 (path: string): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            const fileType = extname(path).substring(1);
            path = readFileSync(pathResolve(path)).toString('base64');
            resolve(`data:image/${fileType};base64,${path}`);
        } catch (error) {
            reject(error);
        }
    });
}