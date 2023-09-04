import { createHash } from "crypto";
import { join as pathjoin, dirname } from "path";
import { getNodeModulePath } from "../system";
import { WError, promiseReject } from "../../error";
import { createUri, isFileExits, readFileUri } from "../file";
import { createExParamPromise } from "..";
import type { GetChecksumsData } from "./types/index";

/** 捕获校验和数据位置 */
const getChecksumsPositionRegexp = /^([\w\W]*"checksums"\s*:\s*\{)([^\{\}]*)(\}[\w\W]*)$/;

const getChecksumsDataRegexp = /(?:"(.*)"\s*:\s*"(.*)")/g;

/**
 * 计算文件校验和
 * @param content 需要计算的文件
 */
export function computeFileChecksums (content: string) {
    return createHash('md5').update(content).digest('base64').replace(/=+$/, '');
}

/** 获取product.json文件的位置 */
export function getProduceRoot (): Promise<string> {
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

/**
 * 获取检测校验和文件的根目录
 */
export function getCheckRoot (): Promise<string> {
    return new Promise((resolve, reject) => {
        getProduceRoot().then(path => {
            resolve(pathjoin(path, 'out'));
        }).catch(err => {
            reject(promiseReject(err, 'getCheckRoot'));
        });
    });
}

/** 获取当前所有校验和数据 */
export function getChecksumsData (): Promise<void|Array<GetChecksumsData>> {
    return new Promise((resolve, reject) => {
        getProduceRoot().then(path => {
            const uri = createUri(pathjoin(path, 'product.json'));
            return createExParamPromise(isFileExits(uri), uri);
        }).then(([state, path]) => {
            if (state) {
                // 文件存在
                return readFileUri(path);
            }
        }).then(value => {
            if (value) {
                return Promise.resolve(value.toString());
            }
        }).then(str => {
            if (str) {
                return Promise.resolve(str.match(getChecksumsPositionRegexp));
            }
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
                resolve();
                return;
            }
            resolve(allContent);
        }).catch(err => {
            reject(promiseReject(err, 'getChecksumsData'));
        });
    });
}