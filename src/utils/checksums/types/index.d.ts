
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

export type ChecksumsDataOperation<T> = {
    set(name: string, data: CheckSumsData): void;
    get(name: string): undefined | CheckSumsData;
    delete(name: string): void;
    has(name: string): boolean;
    clear(): void;
    update(name: string, hash: string): void;
} & Record<"origin", T>