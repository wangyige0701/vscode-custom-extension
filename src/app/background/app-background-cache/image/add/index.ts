/** @fileoverview 新增的图片数据写入文件并存入缓存 */

import { backgroundHashCodes as hashCodeArray, getHashCodesFromWorkspaceAndCache } from "../../hash";
import { createFileStore } from "../../../app-background-image";
import { range } from "../../../../../utils";
import { refreshImagesPath } from "../../../app-background-workspace";
import { $rej } from "../../../../../error";

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
                hashCodeArray.unshift(code);
            }
            return refreshImagesPath(hashCodeArray.origin);
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