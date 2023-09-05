import { Webview } from "vscode";
import { MessageData } from "../utils/webview/type";
import { backgroundSendMessageData } from "./type";
import { $undefined, isObject } from "../utils";
import { messageSend } from "../utils/webview/message";

/** webview实例保存 */
export const webviewInstance: { value: Webview|undefined } = {
    value: $undefined()
};

/**
 * 背景图设置webview端发送通信统一处理
 * @param options 
 */
export function backgroundSendMessage (options: backgroundSendMessageData): void {
    if (webviewInstance.value && options && isObject(options)) {
        options.group = 'background';
        messageSend(webviewInstance.value, options as MessageData);
    }
}

