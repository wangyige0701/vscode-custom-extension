import { Webview } from "vscode";
import { MessageData } from "./main";
import { backgroundMessageData } from "../../backgroundImage/data";
import { backgroundExecute } from "../../backgroundImage/execute";
import { errHandle } from "../../error";

/**
 * webview侧通信事件接收统一处理
 */
export function messageHandle (webview: Webview) {
    webview.onDidReceiveMessage((message: MessageData) => {
        switch (message.group) {
            case 'background':
                // 背景图数据处理
                backgroundExecute(<backgroundMessageData>{ 
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
 * webview端发送通信信息
*/
export function messageSend (webview: Webview, options: MessageData): void {
    if (webview) {
        try {
            webview.postMessage(options);
        } catch (error) {
            errHandle(error);
        }
    }
}