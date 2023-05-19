import { ExtensionContext, Webview } from "vscode";

export type MessageGroup = 'background';

/**
 * webview端发送通信信息方法
 */
export interface MessageSend {
    (webview: Webview, options: MessageData): void;
}

export interface MessageData {
    group: MessageGroup;
    name: string;
    value: any;
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