import type { ExtensionContext, StatusBarItem } from 'vscode';
import { window, StatusBarAlignment } from "vscode";

/** 终止函数 */
var stopFunction: (() => void) | undefined;

/** 设置时间显示在状态栏，添加闹钟功能 */
export function showTimeInStatusBar (context: ExtensionContext) {
    const statusBarItemInstance = window.createStatusBarItem(StatusBarAlignment.Right, -1 * (10 ** 8));
    context.subscriptions.push(statusBarItemInstance);
    stopFunction = timerCaller(statusBarItemInstance);
}

/** 关闭时间显示 */
export function stopTimeInStatusBar () {
    typeof stopFunction === 'function' && stopFunction();
}

/** 设置时间函数 */
function timerCaller (statusBar: StatusBarItem) {
    let time = Date.now(), timeclear: NodeJS.Timeout;
    statusBar.text = getTimeString(time);
    function timer () {
        /** 秒数误差 */
        const secondMis = 1000 - (time % 1000), 
        s = new Date(time).getSeconds(), 
        wait = (59 - s) * 1000 + secondMis;
        timeclear = setTimeout(() => {
            time = Date.now();
            statusBar.text = getTimeString(time);
            timer();
        }, wait);
    }
    timer();
    statusBar.show();
    return function (hide: boolean = true) {
        if (timeclear) {
            clearTimeout(timeclear);
        }
        hide && statusBar.hide();
    };
}

/** 获取当前时间 */
function getTimeString (timestamp: number) {
    let date = new Date(timestamp),
    y = date.getFullYear(),
    M = date.getMonth() + 1,
    d = date.getDate(),
    h = date.getHours(),
    m = date.getMinutes(),
    meridiem = 'AM';
    if (h > 11 && h < 23) {
        meridiem = 'PM';
    }
    if (h > 12) {
        h = h - 12;
    }
    return `$(wangyige-clock) ${y}/${_a(M)}/${_a(d)} ${_a(h)}:${_a(m)} ${meridiem}`;
}

/** 补位 */
function _a (value: number): string {
    return `${value}`.padStart(2, '0');
}