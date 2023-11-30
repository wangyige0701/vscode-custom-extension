/** @description 哈希码数据储存模块，hash模块中层级最高的文件 */

import { getHashCode } from "../../../../utils";
import { RecordDataByArray } from "../../../../utils/recordData/array";

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

/** 图片哈希码数据维护 */
export const backgroundHashCodes = new BackgroundHashCodes();