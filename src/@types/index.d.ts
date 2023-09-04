
/** webview、扩展通讯的消息数据类型 */
interface MessageDataType {
    group?:string;
    name: string;
    value?: any;
}

/** 将第一个类型和数组中的类型合并 */
type MergeTypes<T, P extends Array<any>> = [T, ...P];