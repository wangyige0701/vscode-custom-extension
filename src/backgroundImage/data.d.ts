interface dataType {
    group?:string;
    name: string;
    value: any;
}

/**
 * 接收通信数据类型
 */

export type backgroundMessageData = backgroundInitType | selectImageType | deleteImageType | settingBackgroundType;

interface backgroundInitType extends dataType {
    name: 'backgroundInit';
    value: boolean;
}

interface selectImageType extends dataType {
    name: 'selectImage';
    value: boolean;
}

interface deleteImageType extends dataType {
    name: 'deleteImage';
    value: string;
}

interface settingBackgroundType extends dataType {
    name: 'settingBackground';
    value: {
        code: string,
        index: number
    };
}

/**
 * 发送通信信息类型
*/
export type backgroundSendMessageData = backgroundInitDataType | newImageType | deleteImageSuccessType | settingBackgroundSuccessType;

interface backgroundInitDataType extends dataType {
    name: 'backgroundInitData';
    value: string[][];
}

interface newImageType extends dataType {
    name: 'newImage';
    value: [string, string]
}

interface deleteImageSuccessType extends dataType {
    name: 'deleteImageSuccess';
    value: string;
}

interface settingBackgroundSuccessType extends dataType {
    name: 'settingBackgroundSuccess';
    value: number | string
}

/**
 * 读取.wyg文件时返回的格式类型
 */
export interface bufferAndCode {
    buffer:Uint8Array;
    code:string;
}