import type { RecordDataByMapType } from "../../../utils/recordData/types"

/** 校验和数据缓存 */
export interface CheckSumsData {
    /** 校验和数据 */
    value: string;
    /** 根据路径创建的正则表达式 */
    regexp: RegExp;
    /** 路径 */
    path: string;
    /** 返回重置哈希值的字符 */
    reset: (content: string, hash: string) => string;
}

/** 获取的当前校验和文件数据 */
export interface GetChecksumsData {
    path: string;
    hash: string;
}

/** 校验和数据记录类 */
export type CheckSumsDataRecordType<T> = {
    same(name: string, hash: string): boolean;
    update(name: string, hash: string): void;
} & RecordDataByMapType<T>;