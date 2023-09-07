import { createHash } from "crypto";
import { join as pathjoin, dirname } from "path";
import { getNodeModulePath } from "../system";
import { WError, promiseReject } from "../../error";
import { createUri, isFileExits, readFileUri } from "../file";
import { createExParamPromise } from "..";
import type { GetChecksumsData } from "./types/index";

/** 捕获校验和数据位置 */
const getChecksumsPositionRegexp = /^([\w\W]*"checksums"\s*:\s*\{)([^\{\}]*)(\}[\w\W]*)$/;

/** 依次获取校验和所有数据 */
const getChecksumsDataRegexp = /(?:"(.*)"\s*:\s*"(.*)")/g;

/** 通过根路径获取product.json文件的实际路径 */
export function getProductFileName (root: string) {
    return pathjoin(root, 'product.json');
}

/**
 * 计算文件校验和
 * @param content 需要计算的文件内容
 */
export function computeFileChecksums (content: string): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            const result = createHash('md5').update(content).digest('base64').replace(/=+$/, '');
            resolve(result);
        } catch (error) {
            reject(promiseReject(error, 'computeFileChecksums'));
        }
    });
}

/** 获取product.json文件的位置 */
export function getProductRoot (): Promise<string> {
    return new Promise((resolve, reject) => {
        const modulePath = getNodeModulePath();
        if (!modulePath) {
            reject(new WError('NodeModule is Undefined', {
                position: 'Function',
                FunctionName: 'getProducePosition',
                description: 'Current Module is not main module.'
            }));
            return;
        }
        resolve(pathjoin(dirname(modulePath), '..'));
    });
}

/** 获取检测校验和文件的根目录 */
export function getCheckRoot (): Promise<string> {
    return new Promise((resolve, reject) => {
        getProductRoot().then(path => {
            resolve(pathjoin(path, 'out'));
        }).catch(err => {
            reject(promiseReject(err, 'getCheckRoot'));
        });
    });
}

/** 读取校验和文件的数据 */
export function readChecksumsData (): Promise<string> {
    return new Promise((resolve, reject) => {
        getProductRoot().then(path => {
            const uri = createUri(getProductFileName(path));
            return createExParamPromise(isFileExits(uri), uri);
        }).then(([state, path]) => {
            if (state) {
                // 文件存在
                return readFileUri(path);
            }
        }).then(value => {
            if (value) {
                resolve(value.toString());
                return;
            }
            resolve('');
        }).catch(err => {
            reject(promiseReject(err, 'readChecksumsData'));
        });
    });
}

/** 获取当前所有校验和数据 */
export function getChecksumsData (): Promise<Array<GetChecksumsData>> {
    return new Promise((resolve, reject) => {
        readChecksumsData().then(str => {
            return Promise.resolve(str.match(getChecksumsPositionRegexp));
        }).then(reg => {
            if (reg) {
                return Promise.resolve(reg[2].matchAll(getChecksumsDataRegexp));
            }
        }).then(res => {
            if (res) {
                const array = [...res];
                return Promise.resolve(array.reduce((prev, curr) => {
                    prev.push({
                        path: curr[1],
                        hash: curr[2]
                    });
                    return prev;
                }, <Array<GetChecksumsData>>[]));
            }
        }).then(allContent => {
            if (!allContent || allContent.length <= 0) {
                resolve([]);
                return;
            }
            resolve(allContent);
        }).catch(err => {
            reject(promiseReject(err, 'getChecksumsData'));
        });
    });
}

/**
 * 获取所有校验和文件内路径属性的完整路径
 * @param paths 配置文件中所有校验和文件的相对路径
 * @returns 根据根路径生成的所有需要计算校验和文件的绝队路径
 */
export function getFullPathOfChecksum (paths: string[]): Promise<string[]> {
    return new Promise((resolve, reject) => {
        getCheckRoot().then(root => {
            const result = paths.map(path => createUri(pathjoin(root, path)).toString());
            resolve(result);
        }).catch(err => {
            reject(promiseReject(err, 'getFullPathOfChecksum'));
        });
    });
}