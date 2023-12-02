/** @fileoverview 哈希码相关数据管理模块 */

import type { CodeRefreshType, codeChangeType } from "./../../@types";
import { range } from "../../../../utils";
import { $rej } from "../../../../error";
import { backgroundHashCodes, getHashCodesFromWorkspaceAndCache } from "../hash";
import { imageDataRepository } from "./data";
import { refreshImagesPath, getAllImageHashCodes } from "../../app-background-workspace";

/** 新增的哈希码储存至缓存和储存空间 */
export function addImageToStorage (imageDatas: string[]): Promise<string[]> {
    return new Promise((resolve, reject) => {
        /** 需要发送的数据 */
        const result: string[] = [];
        Promise.all(
            imageDatas.map(imageData => createFileStore(imageData))
        )
        .then(codes => {
            for (const index of range(-1, codes.length - 1)) {
                const code = codes[index];
                result.push(code);
                backgroundHashCodes.unshift(code);
            }
            return refreshImagesPath(backgroundHashCodes.origin);
        })
        .then(() => {
            getHashCodesFromWorkspaceAndCache();
            resolve(result);
        })
        .catch(err => {
            reject($rej(err, addImageToStorage.name));
        });
    });
}


/**
 * 比较缓存数据和新数据是长度否相同，不相同则表明储存路径下可能有文件被删除，需要更新缓存数组。
 * 在上一步操作中，对从目录下获取的数据进行map处理时有完成校验，
 * 如果路径下有新数据是缓存数组中没有的则会往数组内push一个新的哈希码。
 * 所以如果此时两个数组长度不同，则一定是缓存数组长于新数组，有数据被删除。
 * 但在此方法中，对缓存数组长度大于和小于新数组长度都进行处理
 */
export function refreshBackgroundImageList (codes: string[]): Promise<string[]> {
    return new Promise((resolve, reject) => {
        const cacheData = getAllImageHashCodes();
        if (codes.length === cacheData.length) {
            return resolve(codes);
        }
        Promise.resolve().then(() => {
            // 新数组长度等于缓存数组长度，直接返回
            if (codes.length > cacheData.length) {
                // 比缓存数组长则需要添加数据（一般不会出现）
                return compareCodeList(codes, cacheData, 'add');
            } else if (codes.length < cacheData.length) {
                // 短则需要删除数据
                return compareCodeList(cacheData, codes, 'delete');
            } else {
                return Promise.resolve();
            }
        }).then(() => {
            resolve(codes);
        }).catch(err => {
            reject($rej(err, refreshBackgroundImageList.name));
        });
    });
}

/**
 * 根据传入的哈希码发送对应图片base64数据
 * @param options 需要获取数据的哈希码以及传递的类型，用于webview侧判断哪边调用 
 */
export function getBase64DataByCode ({ code, type, thumbnail = false }: { code: string, type: string, thumbnail: boolean }): void {
    if (imageDataRepository.has(code)) {
        backgroundSendMessage({
            name: 'backgroundSendBase64Data',
            value: {
                code, 
                data: imageDataRepository.getImageDataByCode(code, thumbnail), 
                type
            }
        });
    }
}

/**
 * 从储存对象中根据哈希码获取base64数据
 * @param code 图片哈希码
 * @param thumbnail 是否需要缩略图数据
 */
export function getBase64DataFromObject (code: string, thumbnail: boolean = false): string {
    return imageDataRepository.getImageDataByCode(code, thumbnail);
}