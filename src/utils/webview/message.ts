import { Webview } from "vscode";
import { MessageData, MessageGroupCallback, MessageGroupCallbackName, callbackType } from "./main";
import { errlog } from "../../error";

/**
 * 绑定通信回调函数对象
 */
const messageCallback: MessageGroupCallback = {
    onBackground: null,
    onViewImage: null
}

/** 绑定webview侧通信数据接收回调函数 */
export function bindMessageCallback (name: MessageGroupCallbackName, callback: callbackType) {
    if (callback && name in messageCallback) messageCallback[name] = callback;
}

/** 解除webview侧通信数据接收回调函数 */
export function unbindMessageCallback (name: MessageGroupCallbackName) {
    if (name in messageCallback) messageCallback[name] = null;
}

/**
 * webview侧通信事件接收统一处理
 */
export function messageHandle (webview: Webview) {
    webview.onDidReceiveMessage((message: MessageData) => {
        switch (message.group) {
            case 'background':
                // 背景图数据处理
                messageCallback.onBackground?.({ 
                    name: message.name, 
                    value: message.value
                }, webview);
                break;
            case 'viewImage':
                messageCallback.onViewImage?.({
                    name: message.name, 
                    value: message.value
                }, webview);
                break;
            default:
                break;
        }
    });
}

/**
 * 扩展侧向webview侧发送通信数据
*/
export function messageSend (webview: Webview, options: MessageData): void {
    if (webview) {
        try {
            webview.postMessage(options);
        } catch (error) {
            errlog(error);
        }
    }
}