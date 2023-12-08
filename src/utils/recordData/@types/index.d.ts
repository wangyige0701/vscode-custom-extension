
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

/**
 * 使用数组记录数据
 */
export type RecordDataByArrayType<T> = {
    /** 当前数据长度 */
    length: number;
    /** 数组源数据 */
    origin: T[];
    /** 将元素添加至数组末尾 */
    push(data: T): number;
    /** 将元素添加至数组开头 */
    unshift(data: T): number;
    /** 删除数组第一个元素 */
    shift(): undefined | T;
    /** 删除数组最后一个元素 */
    pop(): undefined | T;
    /** 数据中是否包含指定数据 */
    includes(data: T): boolean;
    /** 数据中是否包含所有指定数据 */
    includesAll(...datas: T[]): boolean;
    /** 获取指定数据索引 */
    indexOf(data: T): number;
    /** 移除、替换、新增方式改变数组的内容 */
    splice(start: number): T[];
    splice(start: number, deleteCount: number): T[];
    splice(start: number, deleteCount: number, ...items: T[]): T[];
    splice(start: number, deleteCount?: number, ...items: T[]): T[];
    /** 截取数组 */
    slice(start: number, end?: number): T[];
    /** 清空数组 */
    clear(): void;
    /** 设置数组长度 */
    setLength(length: number): T[];
    /** 获取数组指定索引的数据 */
    get(index: number): undefined | T;
    /** 设置数组指定索引的数据 */
    set(index: number, data: T): void;
};