import type { FileStat, FileType } from 'vscode';
import { Uri, workspace } from 'vscode';
import { posix } from 'path';

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
    return Promise.resolve(workspace.fs.copy(source, target, options));
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
    return Promise.resolve(workspace.fs.delete(uri, options));
}

/**
 * 查看文件夹内容
 * @param uri 
 */
export function readDirectoryUri (uri: Uri): Promise<[string, FileType][]> {
    return Promise.resolve(workspace.fs.readDirectory(uri));
}

/**
 * 创建文件夹
 * @param uri 
 */
export function createDirectoryUri (uri: Uri): Promise<Uri> {
    return new Promise((resolve, reject) => {
        Promise.resolve(workspace.fs.createDirectory(uri))
        .then(() => resolve(uri))
        .catch(reject);
    });
}

/**
 * 查看文件内容
 * @param uri 
 */
export function readFileUri (uri: Uri): Promise<Uint8Array> {
    return Promise.resolve(workspace.fs.readFile(uri));
}

/**
 * 写文件
 * @param uri 
 * @param content 
 */
export function writeFileUri (uri: Uri, content: Uint8Array): Promise<void> {
    return Promise.resolve(workspace.fs.writeFile(uri, content));
}

/**
 * 查看对应uri信息
 * @param uri 
 */
export function uriStat (uri: Uri): Promise<FileStat> {
    return Promise.resolve(workspace.fs.stat(uri));
}