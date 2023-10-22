import type { ExtensionContext, StatusBarItem } from 'vscode';
import { window, StatusBarAlignment, commands } from "vscode";
import { init } from "./alarmClock";

/** 终止函数 */
var stopFunction: ((hide: boolean) => void) | undefined;

/** 设置时间显示在状态栏，添加闹钟功能 */
export function showTimeInStatusBar (subscriptions: ExtensionContext["subscriptions"]) {
    const commandId = "wangyige.time.alarmClock";
    // 注册一个状态栏容器
    const statusBarItemInstance = window.createStatusBarItem(StatusBarAlignment.Right, -1 * (10 ** 8));
    statusBarItemInstance.command = commandId;
    // 注册一个命名方法
    const commandTask = commands.registerCommand(commandId, () => {
        // 打开输入框设置闹钟时间
        // 展示所有闹钟，可以选择删除或者改变状态，可以点击新建跳转创建新闹钟
        // 创建：1、输入时间；2、选择是否每天或每周（注，时间只能设置时和分）
    });
    // 插入执行队列
    subscriptions.push(commandTask, statusBarItemInstance);
    stopFunction = timerCaller(statusBarItemInstance);
    // 初始化闹钟配置
    init();
}

/** 关闭时间显示 */
export function stopTimeInStatusBar (hide: boolean = true) {
    typeof stopFunction === 'function' && stopFunction(hide);
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