import { Webview } from "vscode";

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