/** @description webview侧和扩展侧的数据通信处理 */

import type { Webview } from "vscode";
import type { backgroundMessageData } from "../@types";
import { backgroundImageDataInit, deleteImage, getBase64DataByCode, getBase64DataFromObject, selectImage } from "..";
import { backgroundOpacityModify, requestImageToBackground } from "../modify/modifyByInput";
import { randomSettingBackground } from "../modify/modifyRandom";
import { toViewImage } from "../../viewImage";
import { BackgroundWebviewInstance } from './executeWebview';
import { settingImage } from './executeSetting';
import { messageExecute } from "../../../common/webview";

/** 创建通信数据对应函数执行配置 */
const messageReceiver = messageExecute<backgroundMessageData>({
    /** 初始化背景图数据 value: false | true */
    backgroundInit: {
        execute: {
            func: data => {
                if (data) {
                    backgroundImageDataInit();
                }
            },
            data: true
        }
    },
    /** 发送code，用于获取具体base64数据 */
    getBackgroundBase64Data: {
        execute: {
            func: getBase64DataByCode,
            data: true
        }
    },
    /** 选择图片 value: false | true */
    selectImage: {
        execute: {
            func: data => {
                if (data) {
                    selectImage();
                }
            },
            data: true
        }
    },
    /** 删除图片 value: string[] */
    deleteImage: {
        execute: {
            func: data => {
                if (data && data.length > 0) {
                    deleteImage(...data);
                }
            },
            data: true
        }
    },
    /** 设置背景图 value: { code, index } */
    settingBackground: {
        execute: {
            func: settingImage,
            data: true
        }
    },
    /** 上传外部图片 */
    externalImage: {
        execute: {
            func: requestImageToBackground,
            data: true
        }
    },
    /** 设置背景透明度 */
    backgroundOpacity: {
        execute: {
            func: data => { 
                if (data >= 0.1 && data <= 1) {
                    backgroundOpacityModify(data);
                }
            },
            data: true
        }
    },
    /** 设置随机背景图 */
    randomBackground: {
        execute: {
            func: randomSettingBackground,
            data: true
        }
    },
    /** 查看大图，标题发送哈希码前七位 */
    viewBigImage: {
        execute: {
            func: data => { toViewImage(data, getBase64DataFromObject.bind(null, data), `${data.slice(0, 7)}...`, BackgroundWebviewInstance.value!); },
            data: true
        }
    }
});

/**
 * 背景图webview侧栏页面通信数据处理
 * @param name 
 * @param value 
 * @param messageSend 
 * @param webview 
 */
export function backgroundWebviewCommunication ({ name, value }: backgroundMessageData, webview: Webview) {
    if (!BackgroundWebviewInstance.value) {
        BackgroundWebviewInstance.set(webview);
    }
    // 执行对应方法
    messageReceiver(name, value);
}