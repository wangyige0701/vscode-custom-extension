import { Uri, workspace } from 'vscode';
import { posix } from 'path';

/**
 * 生成新uri
 * @param uri 当前uri
 * @param path 新路径
 * @returns 根据新路径生成的新uri
 */
export function newUri (uri: Uri, path: string): Uri | undefined {
    if (!uri) {
        return;
    }
    return uri.with({ path: posix.join(uri.path, path) });
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
export function createFile (uri: Uri, buffer: Buffer): void {
    if (uri) {
        workspace.fs.writeFile(uri, buffer);
    }
}