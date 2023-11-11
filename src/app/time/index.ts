import type { ExtensionContext, StatusBarItem } from 'vscode';
import { MarkdownString, commands } from "vscode";
import { initAlarmClock, settingAlarmClock, trigger } from "./logic";
import { errlog } from '../../error';
import { setStatusBarItem } from '../../utils/interactive';
import { accurateTime, getTimeString } from "./utils";
import { clockRecord } from './storage';
import { ClockRecord } from './cache';
import { isFunction } from '../../utils';
import type { TimeDisplayConfig } from './types';

/**
 * 时间显示配置
 */
const timeDisplayConfig: TimeDisplayConfig = {
    twelve: true,
    icon: true
};

/** 终止函数 */
var stopFunction: ({ hide: SimpleFunction, reset: SimpleFunction });

/** 生成需要显示的时间字符串 */
var getTimeDisplayInfo: (timstamp: number) => string;

// 初始化配置
initTimeDisplayConfig();

/** 初始化状态栏时间显示，初始化闹钟配置 */
export function initTimeDisplayInStatusBar (subscriptions: ExtensionContext["subscriptions"]) {
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
    initAlarmClock().catch(err => {
        errlog(err);
    }).finally(() => {
        stopFunction = timerCaller(statusBarItemInstance);
    });
    clockRecord.registChange(alarmClockRecordInfo(statusBarItemInstance), true);
}

/** 关闭时间显示，销毁状态栏实例 */
export function destroyTimeInStatusBar () {
    if (!stopFunction) {
        return;
    }
    isFunction(stopFunction.hide) && stopFunction.hide();
    (stopFunction as unknown) = null;
}

/** 调整时间显示文字的配置 */
export function changeTimeDisplayConfig (config: Partial<TimeDisplayConfig>) {
    if (!stopFunction) {
        return;
    }
    Object.assign(timeDisplayConfig, config);
    initTimeDisplayConfig();
    resetTimeDisplay();
}

/** 关闭时间 */
export function hideTimeDisplay () {
    if (!stopFunction) {
        return;
    }
    isFunction(stopFunction.hide) && stopFunction.hide();
}

/** 打开时间 */
export function showTimeDisplay () {
    if (!stopFunction) {
        return;
    }
    isFunction(stopFunction.reset) && stopFunction.reset();
}

/** 根据配置生成需要调用的函数 */
function initTimeDisplayConfig () {
    getTimeDisplayInfo = getTimeString(timeDisplayConfig.twelve, timeDisplayConfig.icon);
}

/** 重置时间显示的文字 */
function resetTimeDisplay () {
    isFunction(stopFunction.reset) && stopFunction.reset();
}

/** 设置时间函数 */
function timerCaller (statusBar: StatusBarItem) {
    let time: number, 
    timeclear: NodeJS.Timeout, 
    latestStorage: number;
    /** 计算延迟并触发文字设置函数 */
    function _timer () {
        _set();
        /** 秒数误差 */
        const secondMis = 1000 - (time % 1000), 
        s = new Date(time).getSeconds(), 
        wait = (59 - s) * 1000 + secondMis;
        timeclear = setTimeout(_timer, wait);
    }
    /** 设置文字 */
    function _set () {
        time = Date.now();
        const value = getTimeDisplayInfo(time),
        check = accurateTime(time);
        if (latestStorage !== check) {
            latestStorage = check;
            // 防止定时器误差提前触发
            statusBar.text = value;
            trigger(time);
        }
    }
    _timer();
    statusBar.show();
    return {
        hide: function () {
            timeclear && clearTimeout(timeclear);
            statusBar.hide();
        },
        reset: function () {
            timeclear && clearTimeout(timeclear);
            latestStorage = NaN;
            time = Date.now();
            _timer();
        }
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