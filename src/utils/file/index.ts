import { FileStat, FileType, Uri, workspace } from 'vscode';
import { posix } from 'path';

/**
 * 生成新uri
 * @param uri 当前uri
 * @param path 新路径
 * @returns 根据新路径生成的新uri
 */
export function newUri (uri: Uri, path: string): Uri {
    return uri.with({ path: posix.join(uri.path, path) });
}

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
 * 调用api创建文件
 * @param uri 生成文件的uri
 * @param buffer 输入文件内容数据
 */
export function createFile (uri: Uri, buffer: Buffer): Thenable<void> {
    return workspace.fs.writeFile(uri, buffer);
}

/**
 * 复制文件
 * @param source 
 * @param target 
 * @param options 
 */
export function uriCopy (source: Uri, target: Uri, options?: { overwrite: boolean }): Thenable<void> {
    return workspace.fs.copy(source, target, options);
}

export function uriDelete (uri: Uri, options?: { recursive: boolean, useTrash: boolean }): Thenable<void> {
    return workspace.fs.delete(uri, options);
}

export function readDirectoryUri (uri: Uri): Thenable<[string, FileType][]> {
    return workspace.fs.readDirectory(uri);
}

export function readFileUri (uri: Uri): Thenable<Uint8Array> {
    return workspace.fs.readFile(uri);
}

export function writeFileUri (uri: Uri, content: Uint8Array): Thenable<void> {
    return workspace.fs.writeFile(uri, content);
}

export function uriStat (uri: Uri): Thenable<FileStat> {
    return workspace.fs.stat(uri);
}