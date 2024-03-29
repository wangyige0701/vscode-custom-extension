/** @description 公用工具函数封装模块 */

import { showMessageWithConfirm } from "../../../common/interactive";
import { minmax } from "../../../utils";
import { sendRandomListInfo } from "../webview/communication/send";

/**
 * 根据给定透明度计算需要设置的透明度
 * @param opacity 
 */
export function getNewBackgroundOpacity (opacity: number): number {
    opacity = minmax(0.1, 1, opacity);
    opacity = +(0.95 + (-0.45 * opacity)).toFixed(2);
    return opacity;
}

/** 
 * 关闭随机切换背景图后的消息提示
 * @param time 指定多少时间后弹出消息弹框，用于和进度条错开
 */
export function closeRandomBackground (time: number = 0) {
    setTimeout(() => {
        showMessageWithConfirm('已关闭背景图随机切换');
    }, time);
    sendRandomListInfo(false);
}