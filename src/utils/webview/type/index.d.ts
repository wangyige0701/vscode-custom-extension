import { ExtensionContext, Webview } from "vscode";

/* 扩展侧和webview侧通信的类型 */

type ExternalFile = 'css' | 'js';

/** 所有的通信组 */
export type MessageGroup = 'background' | 'viewImage';

/** webview侧发送至扩展侧通信数据接收的回调函数 */
export type MessageGroupCallbackName = `on${Capitalize<MessageGroup>}`

export type callbackType = (({ name, value }: any, webview: Webview) => any) | null;

export type MessageGroupCallback = Record<MessageGroupCallbackName, callbackType>;

/** 全局的通讯数据 */
type GlobalMessageGroup = 'viewImageDestroy';

/**
 * webview端发送通信信息方法
 */
export interface MessageSend {
    (webview: Webview, options: MessageData): void;
}

export interface MessageData {
    group: MessageGroup | GlobalMessageGroup;
    name: string;
    value?: any;
}

interface options {
    readonly webviewOptions?: {
        readonly retainContextWhenHidden?: boolean;
    } | undefined;
}

interface contextInter {
    [instance: string]: ExtensionContext | undefined;
}

interface webFileType {
    [key: string]: string;
}

type fb = Buffer | string | Uint8Array;

type ExecuteFunction<F> = {func: ((value: F) => void)|(() => void), data?: boolean, noneParam?:boolean, param?: any};

type ExecuteType<F> = {
    /** 需要执行的函数 */
    execute: ExecuteFunction<F> | Array<ExecuteFunction<F>>;
    /** 是否需要放入队列执行 */
    queue?: boolean;
    /** 额外需要执行的函数 */
    extra?: Function
};

export type GetName<T extends MessageDataType> = Pick<T, "name">["name"];

/** 执行通讯信息对应函数 */
export type MessageExecuteType<T extends MessageDataType> = {
    [K in GetName<T>]: ExecuteType<Extract<T, { name: K }>["value"]>;
} & {
    /** 队列执行函数 */
    queue?: (...funcs: Function[]) => void;
}