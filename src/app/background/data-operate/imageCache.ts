/** @fileoverview 图片缓存数据的额外操作 */

import type { Uri } from "vscode";
import type { CodeRefreshType, CodeChangeType } from "@background/@types";
import { createExParamPromise } from "@/utils";
import { imageDataCache } from "@background/data/imageCache";
import { hashCodeCache } from "@background/data/hashCodeCache";
import { getCompressImage } from "@background/compress/file/getter";

/** 缓存哈希码新增操作 */
export function codeAdd (code: string, originData: string, thumbnailData: string): Promise<string> {
    imageDataCache.set(code, {
        origin: originData??'',
        thumbnail: thumbnailData??''
    });
    return Promise.resolve(code);
}

/** 缓存哈希码删除操作 */
export function codeDelete (code: string): Promise<string> {
    if (imageDataCache.has(code)) {
        imageDataCache.delete(code);
    }
    return Promise.resolve(code);
}

/** 缓存哈希码检查操作 */
export function codeCheck (hashCode: string, imageData: string, uri: Uri): Promise<{
    code: string;
    exist: boolean;
}> {
    return new Promise((resolve, reject) => {
        getCompressImage(hashCode, imageData, uri)
        .then(({ data }) => {
            let exist = true;
            if (hashCodeCache.indexOf(hashCode) < 0) {
                // 缓存数组中不存在，需要添加
                exist = false;
            }
            return createExParamPromise(codeAdd(hashCode, imageData, data), exist);
        })
        .then(([code, exist]) => {
            resolve({ code, exist });
        })
        .catch(reject);
    });
}

/**
 * 对哈希码数据缓存数组进行更新操作
 * @param code
 * @param state
 */
export function codeListRefresh(code: string, state: 'check', options: CodeRefreshType): Promise<{ code: string; exist: boolean; }>;
export function codeListRefresh(code: string, state: 'add' | 'delete', options: CodeRefreshType): Promise<string>;
export function codeListRefresh (
    code: string,
    state: CodeChangeType,
    { addData = void 0, compressData = void 0, uri = void 0 }: CodeRefreshType
) {
    if (state === 'add') {
        return codeAdd(code, addData!, compressData!);
    } else if (state === 'delete') {
        return codeDelete(code);
    } else if (state === 'check') {
        return codeCheck(code, addData!, uri!);
    } else {
        return Promise.resolve(code);
    }
}
