import type { Uri } from "vscode";
import { imageStoreUri } from "./utils";
import {
    base64ByFiletypeAndData,
    createBuffer,
    createDirectoryUri,
    isFileExits,
    joinPathUri,
    newUri,
    readFileUri,
    uriDelete,
    uriStat,
    writeFileUri
} from "../../common/file";
import { $rej } from "../../error";
import { createExParamPromise } from "../../utils";
import { imageCompression } from "../../common/compression";

/** 缩略图的存放文件 */
const compressFileName = 'back.min.wyg';

/** 缩略图存放文件夹 */
const compressFolderName = 'compression';

/**
 * 当指定哈希码的图片没有压缩图时生成一张压缩图，否则跳出
 * @param code 图片哈希码
 * @param data 原图片base64数据
 * @param uri 如果传入参数，必须是图片存放路径的根路径
 */
export function getCompressImage (code: string, data: string, uri?: Uri): Promise<{ code: string, data: string }> {
    return new Promise(resolve => {
        checkHasBeenCompressed(code, uri).then(({ exist, uri }) => {
            if (!exist) {
                // 不存在进行创建
                return createCompressImage(uri, data);
            }
            // 存在则读取
            return readFileUri(uri);
        }).then(buffer => {
            resolve({
                code,
                data: buffer.toString()
            });
        }).catch(() => {
            resolve({ code, data: '' });
        });
    });
}

/**
 * 根据哈希码删除压缩图
 */
export function deleteCompressByCode (code: string): Promise<void> {
    return new Promise((resolve, reject) => {
        imageToCompressedPath(code).then(uri => {
            return createExParamPromise(isFileExits(uri), uri);
        }).then(([exist, uri]) => {
            if (exist) {
                return uriDelete(uri);
            }
        }).then(() => {
            resolve();
        }).catch(err => {
            reject($rej(err, deleteCompressByCode.name));
        });
    });
}

/** 判断压缩文件夹是否存在， 如果不存在，则进行创建 */
export function createCompressDirectory (): Promise<void> {
    return new Promise((resolve, reject) => {
        imageStoreUri().then(uri => {
            // 判断是否存在缩略图文件夹
            const folder = newUri(uri, compressFolderName);
            return createExParamPromise(isFileExits(folder), folder);
        }).then(([exist, folder]) => {
            if (!exist) {
                return createDirectoryUri(folder);
            }
        }).then(() => {
            resolve();
        }).catch(err => {
            reject($rej(err, createCompressDirectory.name));
        });
    });
}

/** 判断是否需要回退层级 */
function isUriFolder (uri: Uri): Promise<Uri> {
    return new Promise((resolve, reject) => {
        uriStat(uri).then(({ type }) => {
            if (type === 1) {
                return joinPathUri(uri, '..');
            }
            return uri;
        }).then(uri => {
            resolve(uri);
        }).catch(err => {
            reject($rej(err, isUriFolder.name));
        });
    });
}

/**
 * 生成压缩图片的路径
 * @param code 需要压缩的图片code
 */
function imageToCompressedPath (code: string, uri?: Uri): Promise<Uri> {
    return new Promise((resolve, reject) => {
        Promise.resolve(
            uri ? isUriFolder(uri) : imageStoreUri()
        ).then(uri => {
            resolve(newUri(uri, compressFolderName, `${code}.${compressFileName}`));
        }).catch(err => {
            reject($rej(err, imageToCompressedPath.name));
        });
    });
}

/**
 * 根据哈希码判断原图是否有压缩图片
 * @param code 需要检测是否有压缩图片的哈希码
 */
function checkHasBeenCompressed (code: string, uri?: Uri): Promise<{ exist: boolean, uri: Uri }> {
    return new Promise((resolve, reject) => {
        imageToCompressedPath(code, uri).then((uri) => {
            return createExParamPromise(isFileExits(uri), uri);
        }).then(([state, uri]) => {
            resolve({ exist: state, uri });
        }).catch(err => {
            reject($rej(err, checkHasBeenCompressed.name));
        });
    });
}

/**
 * 根据原图路径在指定路径下生成压缩图
 * @param uri 生成的图片路径uri
 * @param data 图片base64数据
 */
function createCompressImage (uri: Uri, data: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        imageCompression(data).then(buffer => {
            // 将图片数据转为base64
            return base64ByFiletypeAndData('image', 'webp', buffer);
        }).then(base64 => {
            const buffer = createBuffer(base64);
            return createExParamPromise(writeFileUri(uri, buffer), buffer);
        }).then(([_, buffer]) => {
            resolve(buffer);
        }).catch(err => {
            reject($rej(err, createCompressImage.name));
        });
    });
}