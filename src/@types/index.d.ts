
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

/** 忽略某种类型 */
type ExcludeType<T, K> = T extends K ? never : T;

/** 忽略多个类型 */
type ExcludeTypes<T, K extends Array<any>> = T extends ExpandTypes<K> ? never : T;