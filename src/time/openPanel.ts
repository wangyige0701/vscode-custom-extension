import { getDate } from "../utils";
import { getInputInfo, createAndShowQuickPick, showQuickPick, showProgressByTime } from "../utils/interactive";
import type { AlarmClockRecordItemTask, CreateAlarmClockCallback } from "./types";
import { accurateTime, changeHourTo24, cycleCalculate } from "./utils";

/** 校验时间格式，连接符：[/-:] */
const timeCheck = /(?:^([1-9]|0[1-9]|1[0-9]|2[0-4])[\/\-\:]([0-9]|0[0-9]|[1-5][0-9])$)|(?:^([1-9]|0[1-9]|1[0-2])[\/\-\:]([0-9]|0[0-9]|[1-5][0-9])\s*[pPaA]$).*/;

/**
 * 打开设置闹钟的操作面板
 */
export function openOperationPanel (callback: CreateAlarmClockCallback) {
    /**
     * 创建新闹钟
     */
    function _create () {
        getInputInfo({
            title: "请输入时间",
            prompt: "格式为：时:分；如：9:05/9:05 P  ",
            placeHolder: "时和分的连接符可以是/-:；如果是12小时制，需要在最后写上p或a",
            regexp: timeCheck,
            error: "时间格式错误"
        }).then(res => {
            if (!res) {
                return;
            }
            _options(res);
        });
    }

    /** 触发函数映射 */
    let callMap = [_today, _everyDay, _everyWeek, _everyWeek, _specifyWeek, _specifyDay];

    let descriptions = [
        '只在今天提醒，触发后删除',
        '每一天的相同时间都进行提醒',
        '每周的当前星期的相同时间都进行提醒',
        '每周的指定星期的相同时间都进行提醒',
        '指定日期的相同时间进行提醒，触发后删除'
    ];

    /** 选项列表 */
    const infoList = ['当天提醒', '每天提醒', '每周提醒', '指定星期提醒', '指定年月日提醒'].map((item, index) => {
        return {
            label: item,
            callback: callMap[index],
            description: descriptions[index],
            index
        };
    });

    (callMap as unknown) = null;
    (descriptions as unknown) = null;
    
    /**
     * 打开操作选项
     */
    function _options (time: string) {
        time = changeHourTo24(time);
        showQuickPick(infoList, {
            title: '请选择设置方式',
            placeHolder: `当前预设置时间：${time}`,
            ignoreFocusOut: true
        }).then(res => {
            if (!res) {
                return;
            }
            res.callback?.(accurateTime(new Date(getDate(Date.now(), `YYYY-MM-DD ${time}:00`)).getTime()), Date.now());
        });
    }

    /** 当天，需要判断时间是否超过 */
    function _today (timestamp: number, nowTimestamp: number) {
        if (timestamp < nowTimestamp) {
            showProgressByTime("不能设置过去的时间", 3000);
            return;
        }
        _writeInfo(timestamp, void 0);
    }

    /** 每天提醒 */
    function _everyDay (timestamp: number, nowTimestamp: number) {
        if (timestamp < nowTimestamp) {
            // 设置的日期已经小于当前时间，则插入数据时间设置为第二天
            timestamp = cycleCalculate(timestamp, "DAY");
        }
        _writeInfo(timestamp, "DAY");
    }

    /** 每周提醒 */
    function _everyWeek (timestamp: number, nowTimestamp: number) {
        if (timestamp < nowTimestamp) {
            // 设置的日期已经小于当前时间，则插入数据时间设置为第二周
            timestamp = cycleCalculate(timestamp, "WEEK");
        }
        _writeInfo(timestamp, "WEEK");
    }

    function _specifyWeek (timestamp: number) {}

    function _specifyDay (timestamp: number) {}

    function _writeInfo (timestamp: number, cycle: AlarmClockRecordItemTask["cycle"]) {
        // 打开输入框输入提示信息，不超过一百字
    }

    // 打开面板
    createAndShowQuickPick([{
        callback: _create,
        options: {
            label: '新建闹钟',
        }
    }]);
}
