
// 发送数据类型
export type viewImageSendMessage = changeImageType;

interface changeImageType extends MessageDataType {
    name: 'changeImage';
    value: string;
}

// 接收数据类型
export type viewImageMessageData = MessageDataType;