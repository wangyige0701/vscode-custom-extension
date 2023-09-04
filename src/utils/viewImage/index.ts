import { Disposable, Webview, WebviewPanel } from "vscode";
import { registerWebviewPanel } from "../webview/panel";
import { viewImageMessageData, viewImageSendMessage } from "./type";
import { isObject, queueCreate } from "..";
import { bindMessageCallback, messageExecute, messageSend, unbindMessageCallback } from "../webview/message";
import { MessageData } from "../webview/type";

/** webview实例 */
var viewImageWebviewInstance: WebviewPanel | null = null;

/** 监听实例 */
const viewImageWebviewFuncs: {
    didDispose: null | Disposable;
    didChange: null | Disposable;
} = {
    didDispose: null,
    didChange: null
}

/** 调用方法的webview对象 */
var webviewTarget: Webview | null = null;

/** 记录当前图片数据 */
var recordPath = '';

/** webview实例处理队列 */
const viewHandleQueue = queueCreate(false);

/** 加载图片数据队列 */
const imageDataQueue = queueCreate(false);

/**
 * 调用查看大图
 * @param code 图片哈希码
 * @param image 图片数据，可以是字符串或者是一个获取数据的函数
 * @param title 标题
 */
export function toViewImage (code: string, image: string | Function, title: string, useWebView: Webview) {
    viewHandleQueue.set(viewInstanceCreate.bind(null, code, title, useWebView));
    imageDataQueue.set(imageDataLoad.bind(null, image));
    // 执行webview实例处理队列
    viewHandleQueue.execute();
}

/** webview实例处理 */
function viewInstanceCreate (code: string, title: string, useWebView: Webview) {
    if (!code) return;
    // 实例判断
    if (!viewImageWebviewInstance) {
        // 注册webview页面
        viewImageWebviewInstance = registerWebviewPanel('ViewImage', { path: 'webview/src/viewImage', title: 'image:'+title });
        // webview销毁事件
        viewImageWebviewFuncs.didDispose = viewImageWebviewInstance.onDidDispose(destroyInstance);
        // 切换tab事件
        viewImageWebviewFuncs.didChange = viewImageWebviewInstance.onDidChangeViewState(reShow);
        webviewTarget = useWebView;
        // 绑定事件监听
        bindMessageCallback('onViewImage', getMessage);
        // 直接加载图片
        imageDataQueue.execute();
    } else {
        if (!viewImageWebviewInstance.visible) {
            // 当前已经创建但是没有显示页面，则首先跳转对应的column中
            viewImageWebviewInstance.reveal();
        }
        // 已经创建实例则发送改变数据
        viewImageWebviewInstance.title = 'image:'+title;
        // 发送通讯通知webview关闭旧图片，关闭成功后再加载图片
        viewImageMessage({
            name: 'clearImageData',
            value: true
        });
    }
}

/** 根据图片哈希码加载并发送base64数据 */
function imageDataLoad (imageData: string | Function) {
    if (typeof imageData === 'function') {
        recordPath = imageData();
    } else {
        recordPath = imageData;
    }
    // 图片数据发送
    viewImageMessage({
        name: 'changeImage',
        value: recordPath
    });
}

/** 销毁实例 */
export function disposeViewImage () {
    if (viewImageWebviewInstance) {
        viewImageWebviewInstance.dispose();
    }
    if (viewImageWebviewFuncs) {
        viewImageWebviewFuncs.didDispose?.dispose();
        viewImageWebviewFuncs.didChange?.dispose();
    }
}

/** 从别的tab切换回查看页面时，重新加载图片 */
function reShow () {
    if (recordPath && (viewImageWebviewInstance?.visible??false)) {
        viewImageMessage({
            name: 'changeViewState',
            value: recordPath
        });
    }
}

/** 实例销毁 */
function destroyInstance () {
    // 向所有的webview对象发送，通知大图查看页面已被销毁
    if (webviewTarget) {
        messageSend(webviewTarget!, {
            group: 'viewImageDestroy',
            name: 'viewImageDestroyToBackground'
        });
    }
    unbindMessageCallback('onViewImage');
    disposeViewImage();
    // 清空队列
    viewHandleQueue.clear();
    imageDataQueue.clear();
    // 实例置空
    viewImageWebviewInstance = null;
    webviewTarget = null;
    viewImageWebviewFuncs.didChange = null;
    viewImageWebviewFuncs.didDispose = null;
    recordPath = '';
}

/** 发送通信给webview */
function viewImageMessage (options: viewImageSendMessage) {
    if (viewImageWebviewInstance && options && isObject(options)) {
        options.group = 'viewImage';
        messageSend(viewImageWebviewInstance.webview, options as MessageData);
    }
}

/** 接收的通讯消息处理 */
const messageReceiver = messageExecute<viewImageMessageData>({
    clearImageSuccess: {
        execute: {
            func: (value) => {
                // webview侧清除旧图片数据成功，执行图片数据加载方法
                if (value) imageDataQueue.execute();
            }
        }
    }
});

/** 接收webview侧发送消息 */
function getMessage ({ name, value }: viewImageMessageData, webview: Webview) {
    // 接收通讯
    messageReceiver(name, value);
}