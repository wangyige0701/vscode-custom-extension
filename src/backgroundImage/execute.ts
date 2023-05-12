import { Webview } from "vscode";
import { backgroundImageDataInit, deleteImage, selectImage } from ".";
import { MessageData } from "../utils/webview/main";
import { modifyCssFileForBackground } from "./modify";
import { backgroundMessageData, backgroundSendMessageData } from "./data";
import { isObject } from "../utils";
import { messageSend } from "../utils/webview";

var webviewInstance: Webview;

/**
 * 背景图通信数据处理
 * @param name 
 * @param value 
 * @param messageSend 
 * @param webview 
 */
export function backgroundExecute ({ name, value }: backgroundMessageData, webview: Webview) {
    if (!webviewInstance) webviewInstance = webview;
    switch (name) {
        case 'backgroundInit':
            // 初始化背景图数据 value: false | true
            if (value) backgroundImageDataInit();
            break;
        case 'selectImage':
            // 选择图片 value: false | true
            if (value) selectImage();
            break;
        case 'deleteImage':
            // 删除图片 value: string
            if (value) deleteImage(value);
            break;
        case 'settingBackground':
            // 设置背景图 value: { code, index }
            if (value) 
                modifyCssFileForBackground(value.code).then(() => {
                    backgroundSendMessage({
                        name: 'settingBackgroundSuccess',
                        value: value.index
                    });
                });
            break;
        default:
            break;
    }
}

/**
 * 背景图设置webview端发送通信统一处理
 * @param options 
 */
export function backgroundSendMessage (options: backgroundSendMessageData): void {
    if (webviewInstance && options && isObject(options)) {
        options.group = 'background';
        messageSend(webviewInstance, options as MessageData);
    }
}