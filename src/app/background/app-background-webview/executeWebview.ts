import type { MessageData } from "../../../common/webview/types";
import type { backgroundSendMessageData } from "../@types";
import { isObject } from "../../../utils";
import { messageSend, WebviewInstance } from "../../../common/webview";

/** 侧栏webview实例保存 */
export const BackgroundWebviewInstance = new WebviewInstance();

/**
 * 背景图设置webview端发送通信统一处理
 * @param options 
 */
export function backgroundSendMessage (options: backgroundSendMessageData): void {
    if (BackgroundWebviewInstance.value && options && isObject(options)) {
        options.group = 'background';
        messageSend(BackgroundWebviewInstance.value, options as MessageData);
    }
}

