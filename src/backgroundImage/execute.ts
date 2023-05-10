import { Webview } from "vscode";
import { backgroundImageDataInit, deleteImage, selectImage } from ".";
import { MessageSend } from "../utils/webview/main";

/**
 * 背景图通信数据处理
 * @param name 
 * @param value 
 * @param messageSend 
 * @param webview 
 */
export function backgroundExecute (name: string, value: any, messageSend: MessageSend, webview: Webview) {
    switch (name) {
        case 'backgroundInit':
            // 初始化背景图数据 value: false | true
            if (value) backgroundImageDataInit(messageSend, webview);
            break;
        case 'selectImage':
            // 选择图片 value: false | true
            if (value) selectImage(messageSend, webview);
            break;
        case 'deleteImage':
            // 删除图片 value: string
            if (value) deleteImage(messageSend, webview, value);
            break;
        default:
            break;
    }
}