/** @fileoverview 哈希码相关数据管理模块 */

import { $rej } from "@/error";
import { settingAllHashCodes } from "@background/workspace/setter";
import { getAllImageHashCodes } from "@background/workspace/getter";

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
        decideState(codes, cacheData)
        .then(() => {
            resolve(codes);
        })
        .catch(err => {
            reject($rej(err, refreshBackgroundImageList.name));
        });
    });
}

function decideState (codes: string[], cacheData: string[]) {
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
}

/**
 * 新旧数组进行比较，因为是比较哈希码，不存在数组元素重复的问题
 * @param long 长一点的数组，用于校验
 * @param short 短一点的数组
 */
async function compareCodeList (long: string[], short: string[], type: 'add' | 'delete' = 'add'): Promise<void> {
    for (const item of long) {
        const index = short.findIndex(i => i === item);
        // 直接使用字符串进行操作，因为删除一个数据后再传索引对应的数据会不正确
        if (index < 0) {
            await settingAllHashCodes(item, type);
        }
    }
    return Promise.resolve();
}
