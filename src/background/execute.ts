import { Webview } from "vscode";
import { backgroundImageDataInit, deleteImage, getBase64DataByCode, getBase64DataFromObject, selectImage } from ".";
import { backgroundMessageData } from "./data";
import { backgroundOpacityModify, requestImageToBackground } from "./modifyByInput";
import { randomSettingBackground } from "./modifyRandom";
import { toViewImage } from "../utils/viewImage";
import { webviewInstance } from './execute_webview';
import { settingImage } from './execute_setting';

/**
 * 背景图通信数据处理
 * @param name 
 * @param value 
 * @param messageSend 
 * @param webview 
 */
export function backgroundExecute ({ name, value }: backgroundMessageData, webview: Webview) {
    if (!webviewInstance.value) webviewInstance.value = webview;
    switch (name) {
        case 'backgroundInit':
            // 初始化背景图数据 value: false | true
            if (value) backgroundImageDataInit();
            break;
        case 'getBackgroundBase64Data':
            // 发送code，用于获取具体base64数据
            if (value) getBase64DataByCode(value);
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
            // 上传外部图片
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
            // 查看大图，标题发送哈希码前七位
            if (value) toViewImage(getBase64DataFromObject(value), `${value.slice(0, 7)}...`, webview);
            break;
        default:
            break;
    }
}