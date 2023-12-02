/** @description 图片数据和哈希码的映射缓存初始化 */

import { imageStoreUri } from "../../../app-background-image";

/**
 * 将从储存路径下读取的图片数据和对应哈希码进行缓存
 * @param datas 读取的图片unit8Array数据和哈希码
 */
export function imageFileDataAndHashCodeCache (datas: BufferAndCodeMergeType[]): Promise<string[]> {
    return new Promise((resolve, reject) => {
        imageStoreUri()
        .then(uri => {
            // 校验当前哈希码是否存在于缓存列表中以及获取缩略图
            return Promise.all(datas.map(({ code, buffer }) => {
                return codeListRefresh(code, 'check', { addData: buffer.toString(), uri });
            }));
        }).then(codes => {
            // 判断哪些数据不存在，不存在则插入缓存
            for (const index of range(-1, codes.length - 1)) {
                const { exist, code } = codes[index];
                if (!exist) {
                    backgroundImageCodeArray.unshift(code);
                }
            }
            return codes.map(item => item.code);
        }).then(codes => {
            resolve(codes);
        }).catch(err => {
            reject($rej(err, imageFileDataAndHashCodeCache.name));
        });
    });
}