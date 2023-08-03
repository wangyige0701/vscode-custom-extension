import { Webview } from "vscode";
import { backgroundImageDataInit, deleteImage, selectImage } from ".";
import { backgroundMessageData } from "./data";
import { bindMessageCallback } from "../utils/webview/message";
import { backgroundOpacityModify, requestImageToBackground } from "./modifyByInput";
import { randomSettingBackground } from "./modifyRandom";
import { toViewImage } from "../utils/viewImage";
import { webviewInstance } from './execute_webview';
import { settingImage } from './execute_setting';

// 绑定事件通信回调
bindMessageCallback('onBackground', backgroundExecute);

/**
 * 背景图通信数据处理
 * @param name 
 * @param value 
 * @param messageSend 
 * @param webview 
 */
function backgroundExecute ({ name, value }: backgroundMessageData, webview: Webview) {
    if (!webviewInstance.value) webviewInstance.value = webview;
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
            // 删除图片 value: string[]
            if (value && value.length > 0) deleteImage(...value);
            break;
        case 'settingBackground':
            // 设置背景图 value: { code, index }
            if (value) settingImage(value);
            break;
        case 'externalImage':
            if (value) requestImageToBackground(value);
            break;
        case 'backgroundOpacity':
            // 设置背景透明度
            if (value >= 0.1 && value <= 1) backgroundOpacityModify(value);
            break;
        case 'randomBackground':
            // 设置随机背景图
            randomSettingBackground(value);
            break;
        case 'viewBigImage':
            // 标题发送哈希码前七位
            toViewImage(value.src, `${value.code.slice(0, 7)}...`, webview);
            break;
        default:
            break;
    }
}