
/**
 * 使用map记录数据
 */
export type RecordDataByMapType<T> = {
    /** 插入数据 */
    set(key: string, data: T): void;
    /** 根据key获取数据 */
    get(key: string): undefined | T;
    /** 根据key删除数据 */
    delete(key: string): void;
    /** 是否有指定key */
    has(key: string): boolean;
    /** 清空map */
    clear(): void;
} & Record<"origin", Map<string, T>>;