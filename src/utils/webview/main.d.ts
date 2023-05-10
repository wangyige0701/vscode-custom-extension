import { Webview } from "vscode";

export interface MessageSend {
    (webview: Webview, options: { type: string, value: any }): void;
}