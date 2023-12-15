/** @fileoverview 哈希码数据初始化，从工作空间储存数据中获取数据并存入缓存 */

import type { BufferAndCodeMergeType } from "@background/@types";
import { $rej } from "@/error";
import { range } from "@/utils";
import { hashCodeCache } from "@background/data/hashCodeCache";
import { createFileStore } from "@background/image/file/setter";
import { imageStoreUri } from "@background/image/folder/getter";
import { refreshImagesPath } from "@background/workspace/setter";
import { getAllImageHashCodes } from "@background/workspace/getter";
import { codeListRefresh } from "./imageCache";

/** 从工作区中获取储存的哈希码数据并更新至缓存数组中 */
export function getHashCodesFromWorkspaceAndCache () {
    // 更新储存列表数据
    const caches = getAllImageHashCodes();
    hashCodeCache.setLength(caches.length);
    caches.forEach((item, index) => {
        if (hashCodeCache.get(index) !== item) {
            hashCodeCache.set(index, item);
        }
    });
}

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
                hashCodeCache.unshift(code);
            }
            return refreshImagesPath(hashCodeCache.origin);
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
 * 从储存路径下读取的图片数据，并将对应哈希码进行缓存
 * @param datas 读取的图片unit8Array数据和哈希码
 */
export function imageFileDataAndHashCodeCache (datas: BufferAndCodeMergeType[]): Promise<string[]> {
    return new Promise((resolve, reject) => {
        imageStoreUri()
        .then(uri => {
            // 校验当前哈希码是否存在于缓存列表中以及获取缩略图
            return Promise.all(datas.map(({ code, buffer }) => {
                return codeListRefresh(code, 'check', {
                    addData: buffer.toString(),
                    uri
                });
            }));
        })
        .then(codes => {
            // 判断哪些数据不存在，不存在则插入缓存
            for (const index of range(-1, codes.length - 1)) {
                const { exist, code } = codes[index];
                if (!exist) {
                    hashCodeCache.unshift(code);
                }
            }
            resolve(codes.map(item => item.code));
        })
        .catch(err => {
            reject($rej(err, imageFileDataAndHashCodeCache.name));
        });
    });
}
