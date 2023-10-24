import { getDate } from "../utils";
import { showInputBox, createAndShowQuickPick, showQuickPick, showProgressByTime } from "../utils/interactive";
import type { AlarmClockRecordItemTask, CreateAlarmClockCallback, SpecificWeek } from "./types";
import { accurateTime, changeHourTo24, cycleCalculate, isDateExist } from "./utils";

/**
 * 打开设置闹钟的操作面板
*/
export function openOperationPanel (createAlarmClock: CreateAlarmClockCallback) {
    /** 校验时间格式，连接符：[:] */
    const timeCheck = /(?:^([1-9]|0[1-9]|1[0-9]|2[0-4]):([0-9]|0[0-9]|[1-5][0-9])$)|(?:^([1-9]|0[1-9]|1[0-2]):([0-9]|0[0-9]|[1-5][0-9])\s*[pPaA]$).*/;

    /** 校验年月日格式 */
    const dateCheck = /^(\d{4})[\-\/]([1-9]|0[1-9]|1[0-2])[\-\/]([1-9]|0[1-9]|[1-2][0-9]|3[01])$/;

    /** 提示弹框显示时间 */
    const messageBoxShowTime = 5000;

    /**
     * 创建新闹钟，输入时间
     */
    function _create () {
        showInputBox({
            title: "请输入时间",
            prompt: "格式为：时:分；如：9:05/9:05 P  ",
            placeHolder: "时和分的连接符可以是[:]；如果是12小时制，需要在最后写上p或a",
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
    let callMap = [_today, _everyDay, _everyWeek, _specifyWeek, _specifyDay];
    /** 选项描述 */
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
        time = changeHourTo24(time, ":");
        showQuickPick(infoList, {
            title: '请选择设置方式',
            placeHolder: `当前预设置时间：${time}`,
            ignoreFocusOut: true,
            matchOnDetail: true
        }).then(res => {
            if (!res) {
                return;
            }
            res.callback?.(accurateTime(new Date(getDate(Date.now(), `YYYY-MM-DD ${time}:00`)).getTime()), Date.now(), time);
        });
    }

    /** 选择指定星期 */
    function _selectWeeks (callback: (list: SpecificWeek[]) => void) {
        /** 星期列表 */
        const weekList = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((item, index) => {
            return {
                label: item,
                index: index < 6 ? index + 1 : 0
            } as {
                label: string;
                index: SpecificWeek;
            };
        });
        showQuickPick(weekList, {
            title: 'aaaaa',
            placeHolder: '请选择星期',
            canPickMany: true,
            ignoreFocusOut: true,
            matchOnDetail: true
        }).then(res => {
            if (res.length === 0) {
                showProgressByTime("未选择星期", messageBoxShowTime);
                return;
            }
            callback(res.map(item => item.index).sort());
        });
    }

    /** 输入指定年月日 */
    function _writeSpecifyDay (today: number, callback: (date: string) => void) {
        const dayString = getDate(new Date(today), "YYYY-MM-DD");
        showInputBox({
            title: '请输入年月日',
            placeHolder: '以[-/]连接年月日的数据',
            prompt: `如：${dayString}  `,
            value: dayString
        }, (text) => {
            if (!dateCheck.test(text)) {
                return "年月日格式错误";
            }
            const matchResult = text.match(dateCheck)!.splice(1, 3);
            if (!isDateExist(matchResult[0], matchResult[1], matchResult[2])) {
                return `日期：“${text}”不存在`;
            }
            return "";
        }).then(res => {
            if (!res) {
                return;
            }
            callback(res);
        });
    }

    /** 当天，需要判断时间是否超过 */
    function _today (timestamp: number, nowTimestamp: number) {
        if (timestamp < nowTimestamp) {
            showProgressByTime(`[${getDate(timestamp)}] 不能设置过去的时间`, messageBoxShowTime);
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

    /** 指定星期提醒 */
    function _specifyWeek (timestamp: number, nowTimestamp: number) {
        _selectWeeks((weekList) => {
            const nowWeek = new Date(nowTimestamp).getDay() as SpecificWeek;
            if (timestamp < nowTimestamp && weekList.includes(nowWeek)) {
                // 选择的星期包括今天并且时间小于当前，插入下一天的时间戳
                timestamp = cycleCalculate(timestamp, weekList);
            }
            _writeInfo(timestamp, weekList);
        });
    }

    /** 指定年月日的时间提醒 */
    function _specifyDay (timestamp: number, nowTimestamp: number, inputTime: string) {
        _writeSpecifyDay(nowTimestamp, (date) => {
            const settingTime = new Date(`${date} ${inputTime}:00`).getTime();
            if (settingTime < nowTimestamp) {
                showProgressByTime(`[${getDate(settingTime)}] 不能设置过去的时间`, messageBoxShowTime);
                return;
            }
            _writeInfo(settingTime, void 0);
        });
    }

    /** 输入提示信息 */
    function _writeInfo (timestamp: number, cycle: AlarmClockRecordItemTask["cycle"]) {
        showInputBox({
            title: '请输入提醒内容',
            placeHolder: "请输入"
        }, (text) => {
            if (text.length > 100) {
                return "输入字数不能超过一百字";
            }
            return "";
        }).then(text => {
            createAlarmClock(timestamp, text??"", cycle);
        });
    }

    // 打开面板
    createAndShowQuickPick([{
        callback: _create,
        options: {
            label: '新建闹钟',
        }
    }]);
}
