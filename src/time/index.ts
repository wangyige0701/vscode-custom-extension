import type { ExtensionContext, StatusBarItem } from 'vscode';
import { MarkdownString, commands } from "vscode";
import { initAlarmClock, settingAlarmClock, trigger } from "./logic";
import { errlog } from '../error';
import { setStatusBarItem } from '../utils/interactive';
import { getTimeString } from "./utils";
import { clockRecord } from './storage';
import { ClockRecord } from './cache';

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
    clockRecord.registChange(alarmClockRecordInfo(statusBarItemInstance));
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

/**
 * 状态栏鼠标悬浮显示提示文字处理
 */
const alarmClockRecordInfo: ((statusBar: StatusBarItem) => (this: ClockRecord) => void) = (statusBar) => {
    const markdown = new MarkdownString();
    markdown.supportThemeIcons = true;
    markdown.supportHtml = true;
    function colorSpan (content: string, color: string = "#3794ff") {
        return `<span style='color:${color};'>${content}</span>`;
    }
    function setColor (str: TemplateStringsArray, num: number) {
        return str[0] + colorSpan(num.toString()) + str[1];
    }
    return function () {
        markdown.value = "";
        markdown.appendMarkdown("### 闹钟信息：\n ");
        const alarmClockNumber = this.length;
        let alarmTaskNumber = 0;
        this.forEach(item => {
            alarmTaskNumber += this.getTaskNumber(item);
        });
        if (alarmClockNumber > 0) {
            markdown.appendMarkdown(setColor`  - 闹钟数量：${alarmClockNumber}个 \n\n `);
            markdown.appendMarkdown(setColor`  - 任务数量：${alarmTaskNumber}个 \n\n `);
        } else {
            markdown.appendMarkdown("    暂无闹钟数据 \n\n ");
        }
        markdown.appendMarkdown("> " + colorSpan("点击打开闹钟面板 $(chevron-down)"));
        statusBar.tooltip = markdown;
    };
};