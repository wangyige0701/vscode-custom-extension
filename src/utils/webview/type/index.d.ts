import { ExtensionContext, Webview } from "vscode";

/* 扩展侧和webview侧通信的类型 */

/** 所有的通信组 */
export type MessageGroup = 'background' | 'viewImage';

/** webview侧发送至扩展侧通信数据接收的回调函数 */
export type MessageGroupCallbackName = `on${Capitalize<MessageGroup>}`

export type callbackType = (({ name, value }: any, webview: Webview) => any) | null;

export type MessageGroupCallback = Record<MessageGroupCallbackName, callbackType>;

/**
 * webview端发送通信信息方法
 */
export interface MessageSend {
    (webview: Webview, options: MessageData): void;
}

export interface MessageData {
    group: MessageGroup | 'viewImageDestroy';
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