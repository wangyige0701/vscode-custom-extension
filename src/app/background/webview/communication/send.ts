/** @fileoverview 扩展侧向webview侧发送数据 */

import type { MessageData } from "@/common/webview/@types";
import type { backgroundSendMessageData } from "@background/@types";
import { isObject, isUndefined } from "@/utils";
import { messageSend, WebviewInstance } from "@/common/webview";
import { imageDataCache } from "@background/data/imageCache";
import { getNowIsSetBackground, getNowSettingCode, getNowSettingOpacity, getNowIsSetRandom, getRandomList } from "@background/workspace/getter";

/** 侧栏webview实例保存 */
export const BackgroundWebviewInstance = new WebviewInstance();

/**
 * 背景图设置webview端发送通信统一处理
 * @param options
 */
export function backgroundSendMessage (options: backgroundSendMessageData): void {
    if (BackgroundWebviewInstance.value && options && isObject(options)) {
        options.group = 'background';
        messageSend(BackgroundWebviewInstance.value, options as MessageData);
    }
}

/**
 * 根据传入的哈希码发送对应图片base64数据
 * @param options 需要获取数据的哈希码以及传递的类型，用于webview侧判断哪边调用
 */
export function sendBase64DataByCode ({ code, type, thumbnail = false }: { code: string, type: string, thumbnail: boolean }): void {
    if (imageDataCache.has(code)) {
        backgroundSendMessage({
            name: 'backgroundSendBase64Data',
            value: {
                code,
                type,
                data: imageDataCache.getImageDataByCode(code, thumbnail)
            }
        });
    }
}

/**
 * 发送初始化后的哈希码数据
 */
export function sendInitializeDatas (codes: string[]) {
    backgroundSendMessage({
        name: 'backgroundInitData',
        value: codes
    });
}

/**
 * 如果已经设置了背景图则发送图片对应的哈希码
 */
export function sendSettingImageCode (value: string | number | undefined = void 0) {
    if (!isUndefined(value)) {
        return backgroundSendMessage({
            name: 'settingBackgroundSuccess',
            value
        });
    }
    if (getNowIsSetBackground()) {
        backgroundSendMessage({
            name: 'settingBackgroundSuccess',
            value: getNowSettingCode()
        });
    }
}

/**
 * 发送当前设置的透明度
 */
export function sendSettingOpacity (value: number | undefined = void 0) {
    if (!isUndefined(value)) {
        return backgroundSendMessage({
            name: 'nowBackgroundOpacity',
            value
        });
    }
    backgroundSendMessage({
        name: 'nowBackgroundOpacity',
        value: getNowSettingOpacity()
    });
}

/**
 * 发送当前的随机背景设置信息，如果没有设置发送false
 */
export function sendRandomListInfo (value: false | string[] | undefined = void 0) {
    if (!isUndefined(value)) {
        return backgroundSendMessage({
            name: 'backgroundRandomList',
            value
        });
    }
    backgroundSendMessage({
        name: 'backgroundRandomList',
        value: getNowIsSetRandom() ? getRandomList() : false
    });
}

/**
 * 新创建图片文件后发送所有新增图片的哈希码数组
 */
export function sendAfterNewImagesCreate (value: string[]) {
    backgroundSendMessage({
        name: 'newImage',
        value
    });
}

/**
 * 新的网络图片创建后发送新增图片哈希码
 */
export function sendAfterNewNetImageCreate (value: string[]) {
    backgroundSendMessage({
        name: 'newImageNetwork',
        value
    });
}

/**
 * 图片删除成功后发送删除的图片哈希码数组
 */
export function sendAfterDeleteImageSuccess (value: string[]) {
    backgroundSendMessage({
        name: 'deleteImageSuccess',
        value: value
    });
}

/**
 * 背景图储存路径修改通知
 */
export function sendAfterStorePathChange () {
    backgroundSendMessage({
        name: 'backgroundStorePathChange',
        value: true
    });
}
