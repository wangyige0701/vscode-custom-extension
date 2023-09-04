
/** 校验和数据缓存 */
export interface CheckSumsData {
    /** 校验和数据 */
    value: string;
    /** 根据路径创建的正则表达式 */
    regexp: RegExp;
    /** 路径 */
    path: string;
}

/** 获取的当前校验和文件数据 */
export interface GetChecksumsData {
    path: string;
    hash: string;
}