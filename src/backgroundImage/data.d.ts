import { Uri } from "vscode";

interface dataType {
    group?:string;
    name: string;
    value: any;
}

/**
 * 接收通信数据类型
 */

export type backgroundMessageData = backgroundInitType | selectImageType | deleteImageType | settingBackgroundType | 
    externalImageType | backgroundOpacityType | randomBackgroundType;

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
    value: string[];
}

interface settingBackgroundType extends dataType {
    name: 'settingBackground';
    value: {
        code: string,
        index: number
    };
}

interface externalImageType extends dataType {
    name: 'externalImage';
    value: string;
}

interface backgroundOpacityType extends dataType {
    name: 'backgroundOpacity';
    value: number;
}

interface randomBackgroundType extends dataType {
    name: 'randomBackground';
    value: string[];
}

/**
 * 发送通信信息类型
*/
export type backgroundSendMessageData = backgroundInitDataType | newImageType | deleteImageSuccessType | 
settingBackgroundSuccessType | newImageNetworkType | nowBackgroundOpacityType | backgroundStorePathChangeType;

interface backgroundInitDataType extends dataType {
    name: 'backgroundInitData';
    value: string[][];
}

interface newImageType extends dataType {
    name: 'newImage';
    value: [string, string] | undefined;
}

interface deleteImageSuccessType extends dataType {
    name: 'deleteImageSuccess';
    value: string[];
}

interface settingBackgroundSuccessType extends dataType {
    name: 'settingBackgroundSuccess';
    value: number | string;
}

interface newImageNetworkType extends dataType {
    name: 'newImageNetwork';
    value: [string, string] | undefined;
}

interface nowBackgroundOpacityType extends dataType {
    name: 'nowBackgroundOpacity';
    value: number
}

interface backgroundStorePathChangeType extends dataType {
    name: 'backgroundStorePathChange',
    value: boolean
}

/**
 * 读取.wyg文件时返回的格式类型
 */
export interface bufferAndCode {
    buffer:Uint8Array;
    code:string;
}

/**
 * 修改css文件中需要的相关注释信息类型
*/
export interface info {
    VSCodeVersion: string; // vscode版本号
    ExtensionVersion: string; // 当前版本号
    Date: string; // 日期
    ImageCode: string; // 图片哈希码
}

/**
 * index.ts中对数组操作的参数
 */
export type codeChangeType = 'add' | 'delete' | 'check';

/**
 * 文本和uri类型
*/
export interface ContentAndUri {
    content: string;
    uri: Uri;
}