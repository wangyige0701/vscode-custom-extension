import { Webview, WebviewPanel } from "vscode";
import { registerWebviewPanel } from "../webview/panel";
import { viewImageMessageData, viewImageSendMessage } from "./type";
import { isObject } from "..";
import { bindMessageCallback, messageSend, unbindMessageCallback } from "../webview/message";
import { MessageData } from "../webview/type";

var viewImageWebviewInstance: WebviewPanel | null = null;

/** 调用方法的webview对象 */
var webviewTarget: Webview | null = null;

/**
 * 调用查看大图
 * @param path 图片路径或base64编码
 * @param title 标题
 */
export function toViewImage (path: string, title: string, useWebView: Webview) {
    if (!path) return;
    if (!viewImageWebviewInstance) {
        viewImageWebviewInstance = registerWebviewPanel('ViewImage', { path: 'webview/src/viewImage', title: 'image:'+title });
        viewImageWebviewInstance.onDidDispose(destroyInstance);
        webviewTarget = useWebView;
        // 绑定事件监听
        bindMessageCallback('onViewImage', getMessage);
    } else {
        // 已经创建实例则发送改变数据
        viewImageWebviewInstance.title = 'image:'+title;
    }
    sendMessage({
        name: 'changeImage',
        value: path
    });
}

/** 销毁实例 */
export function disposeViewImage () {
    if (viewImageWebviewInstance) {
        viewImageWebviewInstance.dispose();
    }
}

/** 实例销毁 */
function destroyInstance () {
    // 向调用的webview对象发送销毁状态
    if (webviewTarget) messageSend(webviewTarget!, {
        group: 'viewImageDestroy',
        name: 'viewImageDestroyToBackground'
    });
    unbindMessageCallback('onViewImage');
    viewImageWebviewInstance = null;
    webviewTarget = null;
}

/** 发送通信给webview */
function sendMessage (options: viewImageSendMessage) {
    if (viewImageWebviewInstance && options && isObject(options)) {
        options.group = 'viewImage';
        messageSend(viewImageWebviewInstance.webview, options as MessageData);
    }
}

/** 接收webview侧发送消息 */
function getMessage ({ name, value }: viewImageMessageData, webview: Webview) {
    return
}