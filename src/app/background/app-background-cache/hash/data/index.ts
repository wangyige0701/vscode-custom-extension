/** @description 哈希码数据缓存处理模块 */

import { getHashCode } from "../../../../../utils";
import { RecordDataByArray } from "../../../../../utils/recordData/array";

class BackgroundHashCodes extends RecordDataByArray<string> {
    constructor () {
        super();
    }

    /** 判断列表中是否含有此图片哈希码 */
    hasHashCode (...codes: string[]): boolean {
        return this.includesAll(...codes);
    }

    /** 生成一个没有重复的哈希码 */
    newHashCode (): string {
        let code = getHashCode();
        if (this.hasHashCode(code)) {
            return this.newHashCode();
        }
        return code;
    }
}

/** 图片哈希码缓存数组维护实例 */
export const backgroundHashCodes = new BackgroundHashCodes();