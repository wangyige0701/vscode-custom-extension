import { WebviewPanel } from "vscode";
import { registerWebviewPanel } from "../webview/panel";
import { viewImageSendMessage } from "./data";
import { isObject } from "..";
import { messageSend } from "../webview/message";
import { MessageData } from "../webview/main";

var viewImageWebviewInstance: WebviewPanel | null = null;

/**
 * 调用查看大图
 * @param path 图片路径或base64编码
 * @param title 标题
 */
export function toViewImage (path: string, title: string) {
    if (!viewImageWebviewInstance) {
        viewImageWebviewInstance = registerWebviewPanel('ViewImage', { path: 'webview/src/viewImage', title: 'image:'+title });
        viewImageWebviewInstance.onDidDispose(disposeInstance);
    } else {
        // 已经创建实例则发送改变数据
        viewImageWebviewInstance.title = 'image:'+title;
    }
    sendMessage({
        name: 'changeImage',
        value: path
    });
}

/**
 * 销毁实例
 */
export function disposeViewImage () {
    if (viewImageWebviewInstance) {
        viewImageWebviewInstance.dispose();
    }
}

/**
 * 接收销毁事件
 */
function disposeInstance () {
    sendMessage({ name: 'destroy' });
    viewImageWebviewInstance = null;
}

/**
 * 发送通信给webview
 */
function sendMessage (options: viewImageSendMessage) {
    if (viewImageWebviewInstance && options && isObject(options)) {
        options.group = 'viewImage';
        messageSend(viewImageWebviewInstance.webview, options as MessageData);
    }
}