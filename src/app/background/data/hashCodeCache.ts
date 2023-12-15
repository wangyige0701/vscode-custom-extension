/** @fileoverview 哈希码数据缓存处理模块 */

import { getHashCode } from "@/utils";
import { RecordDataByArray } from "@/utils/recordData/array";

var _cache: HashCodeCache;

class HashCodeCache extends RecordDataByArray<string> {
    constructor () {
        super();
        _cache = this;
    }

    /** 判断列表中是否含有此图片哈希码 */
    hasHashCode (...codes: string[]): boolean {
        return _cache.includesAll(...codes);
    }

    /** 生成一个没有重复的哈希码 */
    newHashCode (): string {
        let code = getHashCode();
        if (_cache.hasHashCode(code)) {
            return _cache.newHashCode();
        }
        return code;
    }
}

/** 图片哈希码缓存数组维护实例 */
export const hashCodeCache = new HashCodeCache();
