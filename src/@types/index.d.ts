
/** webview、扩展通讯的消息数据类型 */
interface MessageDataType {
    group?:string;
    name: string;
    value?: any;
}

/** 将第一个类型和数组中的类型合并 */
type MergeTypes<T, P extends Array<any>> = [T, ...P]; 

/** 展开所有类型 */
type ExpandTypes<K extends Array<any>> = K extends [infer X, ...infer R] ? X | ExpandTypes<R> : never;

/** 忽略多个类型 */
type ExcludeTypes<T, K extends Array<any>> = T extends ExpandTypes<K> ? never : T;

/** 去除字符串的on */
type RemoveOnString<T extends keyof any> = T extends `on${infer U}` ? Uncapitalize<U> : T;

/** 去除on */
type RemoveOnName<T> = {
    [K in keyof T as RemoveOnString<K>]: T[K];
}

type KeysRemoveReadonly<T> = T extends { [key: string]: any } ? {
    -readonly [K in keyof T]: KeysRemoveReadonly<T[K]>;
} : T;

/** 指定类型的函数 */
type SimpleFunction<T extends any[] = [void], K extends any = void> = (...params: T) => K;

/** 约束数组长度 */
type ConstrainedArrayLength<T, L extends number> = T[] & { length: L };

/** 判断不为undefined */
type NotUndefined<T> = T extends undefined ? never : T;

/** 获取数组下一个元素 */
type NextArray<T extends any[]> = T extends [infer X, ...infer R] ? R[0] : undefined;

/** 返回去除第一个元素的剩余数组 */
type ExecludeFirstArray<T extends any[]> = T extends [infer X, ...infer R] ? R : [];