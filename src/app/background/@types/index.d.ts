import { Uri } from 'vscode';

/** 接收通信数据类型 */
export type backgroundMessageData =
	| backgroundInitType
	| getBackgroundBase64DataType
	| selectImageType
	| deleteImageType
	| settingBackgroundType
	| externalImageType
	| backgroundOpacityType
	| randomBackgroundType
	| viewBigImageType;

/** 脚本侧通知初始化背景图信息 */
interface backgroundInitType extends MessageDataType {
	name: 'backgroundInit';
	value: boolean;
}

/** webview脚本侧通过code获取具体的base64数据 */
interface getBackgroundBase64DataType extends MessageDataType {
	name: 'getBackgroundBase64Data';
	value: {
		code: string;
		type: string;
		thumbnail: boolean;
	};
}

/** 脚本侧通知打开文件夹选择图片 */
interface selectImageType extends MessageDataType {
	name: 'selectImage';
	value: boolean;
}

/** 脚本侧传递图片哈希码数组通知删除图片 */
interface deleteImageType extends MessageDataType {
	name: 'deleteImage';
	value: string[];
}

/** 脚本侧传递哈希码和索引通知设置此图片为背景图， 需要响应索引 */
interface settingBackgroundType extends MessageDataType {
	name: 'settingBackground';
	value: {
		code: string;
		index: number;
	};
}

/** 脚本侧发送字符串通知下载外部图片储存 */
interface externalImageType extends MessageDataType {
	name: 'externalImage';
	value: string;
}

/** 脚本侧发送数字通知修改透明度 */
interface backgroundOpacityType extends MessageDataType {
	name: 'backgroundOpacity';
	value: number;
}

/** 脚本侧发送字符串数组通知开启背景图随机设置，为空表示从所有图片中随机选择，为false表示关闭随机切换 */
interface randomBackgroundType extends MessageDataType {
	name: 'randomBackground';
	value: string[] | false;
}

/** 查看大图发送图片数据和编码 */
interface viewBigImageType extends MessageDataType {
	name: 'viewBigImage';
	value: string;
}

/**
 * 发送通信信息类型
 */
export type backgroundSendMessageData =
	| backgroundInitDataType
	| backgroundSendBase64DataType
	| newImageType
	| deleteImageSuccessType
	| settingBackgroundSuccessType
	| newImageNetworkType
	| nowBackgroundOpacityType
	| backgroundStorePathChangeType
	| backgroundRandomListType;

/**
 * 通知脚本侧背景图信息初始化完成，返回所有背景图数据
 */
interface backgroundInitDataType extends MessageDataType {
	name: 'backgroundInitData';
	value: string[];
}

/**
 * 发送图片具体的base64数据
 */
interface backgroundSendBase64DataType extends MessageDataType {
	name: 'backgroundSendBase64Data';
	value: { code: string; data: string; type: string };
}

/**
 * 通知脚本侧图片选择完成，返回哈希码
 */
interface newImageType extends MessageDataType {
	name: 'newImage';
	value: string[];
}

/**
 * 通知脚本侧图片删除成功，因为允许多张删除，
 * 所以返回一个所有删除图片的哈希码字符串数组
 */
interface deleteImageSuccessType extends MessageDataType {
	name: 'deleteImageSuccess';
	value: string[];
}

/**
 * 通知脚本侧背景图设置成功，可以返回索引和哈希码，目前全部返回哈希码字符串
 */
interface settingBackgroundSuccessType extends MessageDataType {
	name: 'settingBackgroundSuccess';
	value: number | string;
}

/**
 * 通知脚本侧网络图片下载成功，返回哈希码
 */
interface newImageNetworkType extends MessageDataType {
	name: 'newImageNetwork';
	value: string[];
}

/**
 * 初始化时获取或者设置透明度后通知脚本侧当前透明度信息
 */
interface nowBackgroundOpacityType extends MessageDataType {
	name: 'nowBackgroundOpacity';
	value: number;
}

/**
 * 修改背景图储存路径后通知脚本侧重新渲染图片列表
 */
interface backgroundStorePathChangeType extends MessageDataType {
	name: 'backgroundStorePathChange';
	value: boolean;
}

/**
 * 设置完成随机列表或者初始化时获取随机设置状态后，
 * 返回当前随机设置背景图的列表给脚本侧通知修改相关渲染，
 * 如果取消了随机设置，则返回false
 */
interface backgroundRandomListType extends MessageDataType {
	name: 'backgroundRandomList';
	value: string[] | false;
}

/**
 * 读取.wyg文件时返回的格式类型，将unit8Array类型数组数据和哈希码一起返回
 */
export interface BufferAndCodeMergeType {
	buffer: Uint8Array;
	code: string;
}

/**
 * 修改css文件中需要的相关注释信息类型
 */
export interface CssFileAnnotationInfo {
	VSCodeVersion: string; // vscode版本号
	ExtensionVersion: string; // 当前版本号
	Date: string; // 日期
	ImageCode: string; // 图片哈希码
}

/**
 * index.ts中对数组操作的参数
 */
export type CodeChangeType = 'add' | 'delete' | 'check';

/**
 * 文本和uri类型
 */
export interface ContentAndUri {
	content: string;
	uri: Uri;
}

/** 缓存刷新函数选项类型 */
export interface CodeRefreshType {
	addData?: string;
	compressData?: string;
	uri?: Uri;
}

/** 背景图校验属性 */
interface BackCheckCompleteProperty {
	/** 是否校验完成 */
	check: boolean;
	/** 是否需要初始化 */
	init: boolean;
	/** 是否正在初始化中 */
	running: boolean;
}

type BackCheckCompleteOnEvent<T> = {
	[K in keyof T as `on${Capitalize<string & K>}`]: () => void;
};

type BackCheckCompleteOffEvent<T> = {
	[K in keyof T as `off${Capitalize<string & K>}`]: () => void;
};

/** 判断背景图校验是否完成 */
export type BackgroundCheckComplete = BackCheckCompleteProperty &
	BackCheckCompleteOnEvent<BackCheckCompleteProperty> &
	BackCheckCompleteOffEvent<BackCheckCompleteProperty>;
