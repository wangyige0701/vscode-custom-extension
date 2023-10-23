import type { ExtensionContext, StatusBarItem } from 'vscode';
import { commands } from "vscode";
import { initAlarmClock, settingAlarmClock, trigger } from "./alarmClock";
import { errlog } from '../error';
import { setStatusBarItem } from '../utils/interactive';

/** 终止函数 */
var stopFunction: ((hide: boolean) => void) | undefined;

/** 设置时间显示在状态栏，添加闹钟功能 */
export function showTimeInStatusBar (subscriptions: ExtensionContext["subscriptions"]) {
    const commandId = "wangyige.time.alarmClock";
    // 注册一个状态栏容器
    const statusBarItemInstance = setStatusBarItem({
        alignment: 'Right',
        priority: -1 * (10 ** 8),
        command: commandId,
    });
    // 注册一个命名方法
    const commandTask = commands.registerCommand(commandId, settingAlarmClock);
    // 插入执行队列
    subscriptions.push(commandTask, statusBarItemInstance);
    // 初始化闹钟配置
    initAlarmClock().then(() => {
        stopFunction = timerCaller(statusBarItemInstance);
    }).catch(err => {
        errlog(err);
    });
}

/** 关闭时间显示 */
export function stopTimeInStatusBar (hide: boolean = true) {
    typeof stopFunction === 'function' && stopFunction(hide);
}

/** 设置时间函数 */
function timerCaller (statusBar: StatusBarItem) {
    let time = Date.now(), timeclear: NodeJS.Timeout;
    statusBar.text = getTimeString(time);
    function _timer () {
        /** 秒数误差 */
        const secondMis = 1000 - (time % 1000), 
        s = new Date(time).getSeconds(), 
        wait = (59 - s) * 1000 + secondMis;
        timeclear = setTimeout(() => {
            time = Date.now();
            const value = getTimeString(time);
            if (value !== statusBar.text) {
                // 防止定时器误差提前触发
                statusBar.text = value;
                trigger(time);
            }
            _timer();
        }, wait);
    }
    _timer();
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