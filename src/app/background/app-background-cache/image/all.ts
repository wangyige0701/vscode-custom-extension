/** @fileoverview 获取储存路径下所有图片base64数据和哈希码 */

import { backgroundImageCodeArray } from "../hash/data";

/**
 * 将从储存路径下读取的图片base64数据和对应哈希码一起返回
 * @param buffers 
 */
export function changeToString (buffers: bufferAndCode[]): Promise<string[]> {
    return new Promise((resolve, reject) => {
        imageStoreUri().then(uri => {
            // 校验当前哈希码是否存在于缓存列表中以及获取缩略图
            return Promise.all(buffers.map(({ code, buffer }) => {
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
            reject($rej(err, changeToString.name));
        });
    });
}

/**
 * 校验储存图片base64数据的文件并进行读取
 * @param files 指定目录下的所有文件列表
 * @param uri 
 */
function checkImageFile (files: [string, FileType][], uri: Uri): Promise<bufferAndCode[]> {
    return new Promise((resolve, reject) => {
        Promise.resolve().then(() => {
            /** 异步处理数组 */
            const fileRequest: Array<Promise<{ buffer: Uint8Array, code: string }>> = [],
            /** 匹配文件正则 */
            searchRegexp = /(.*?).back.wyg$/,
            /** 辅助检测数组 */
            checkArray: number[] = [];
            for (const i of range(files.length)) {
                const file = files[i][0];
                // 对满足要求的文件进行文件数据读取
                const reg = file.match(searchRegexp);
                if (!reg) {
                    continue;
                }
                const index = backgroundImageCodeArray.indexOf(reg[1]);
                // 需要加一个index为-1的判断，防止递归死循环
                const posi = index >= 0 ? bisectionAsce(checkArray, index) : 0;
                checkArray.splice(posi, 0, index);
                fileRequest.splice(posi, 0, getFileAndCode(newUri(uri, file), reg[1]));
            }
            return Promise.all(fileRequest);
        }).then(res => {
            resolve(res);
        }).catch(err => {
            reject($rej(err, checkImageFile.name));
        });
    });
}