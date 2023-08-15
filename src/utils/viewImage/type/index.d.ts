
interface dataType {
    group?:string;
    name: string;
    value?: any;
}

// 发送数据类型
export type viewImageSendMessage = changeImageType;

interface changeImageType extends dataType {
    name: 'changeImage';
    value: string;
}

// 接收数据类型
export type viewImageMessageData = dataType;