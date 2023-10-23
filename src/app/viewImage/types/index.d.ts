
// 发送数据类型
export type viewImageSendMessage = changeImageType | changeViewStateType | clearImageDataType;

/** 图片切换 */
interface changeImageType extends MessageDataType {
    name: 'changeImage';
    value: string;
}

/** 从别的tab切换会查看页面时发送，通知重新加载 */
interface changeViewStateType extends MessageDataType {
    name: 'changeViewState';
    value: string;
}

/** 清除旧图片 */
interface clearImageDataType extends MessageDataType {
    name: 'clearImageData';
    value: boolean;
}

// 接收数据类型
export type viewImageMessageData = clearImageSuccessType;

interface clearImageSuccessType extends MessageDataType {
    name: 'clearImageSuccess';
    value: boolean;
}