import type { QuickPickItem } from "vscode";
import { getDate } from "../utils";
import { createQuickPick, showProgressByTime, MultiStep } from "../utils/interactive";
import type { AlarmClockRecordItemTask, CreateAlarmClockCallback, SpecificWeek } from "./types";
import { accurateTime, changeHourTo24, cycleCalculate, isDateExist } from "./utils";
import { createQuickButton } from "../utils/interactive/button";

/**
 * 打开设置闹钟的操作面板
*/
export function openAlarmClockPanel (createAlarmClock: CreateAlarmClockCallback, clockFullInfoType: string) {
    /** 校验时间格式，连接符：[:] */
    const timeCheck = /(?:^([1-9]|0[1-9]|1[0-9]|2[0-4]):([0-9]|0[0-9]|[1-5][0-9])$)|(?:^([1-9]|0[1-9]|1[0-2]):([0-9]|0[0-9]|[1-5][0-9])\s*[pPaA]$).*/;

    /** 校验年月日格式 */
    const dateCheck = /^(\d{4})[\-\/]([1-9]|0[1-9]|1[0-2])[\-\/]([1-9]|0[1-9]|[1-2][0-9]|3[01])$/;

    /** 提示弹框显示时间 */
    const messageBoxShowTime = 5000;

    let totalSteps = 3;

    /**
     * 创建新闹钟，输入时间
     */
    function _create () {
        MultiStep.showInputBox({
            step: 1,
            totalSteps,
            title: "请输入时间",
            prompt: "格式为：时:分；如：9:05/9:05 P  ",
            placeHolder: "时和分的连接符是 : ；如果是12小时制，需要在最后写上p或a表示时段",
            regexp: timeCheck,
            error: "时间格式错误",
            back: true,
            $proxy: true,
            $complete: (res, nextStep) => {
                if (!res) {
                    return;
                }
                _options(res);
                nextStep();
            }
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
            callback: callMap[index] as ((timestamp: number, nowTimestamp: number, inputTime: string) => void | false),
            description: descriptions[index],
            index
        };
    });
    (callMap as unknown) = null, (descriptions as unknown) = null;
    /**
     * 打开操作选项
     */
    function _options (time: string) {
        time = changeHourTo24(time, ":");
        MultiStep.showQuickPick(infoList, {
            step: 2,
            totalSteps,
            title: '请选择设置方式',
            placeHolder: `当前预设置时间：${time}`,
            ignoreFocusOut: true,
            matchOnDetail: true,
            back: true,
            $complete: (res, nextStep) => {
                if (!res) {
                    return;
                }
                // 返回false则不进行下一步的跳转
                const state = res.callback?.(accurateTime(new Date(getDate(Date.now(), `YYYY-MM-DD ${time}:00`)).getTime()), Date.now(), time);
                if (state === false) {
                    return;
                }
                nextStep();
            }
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
        const selectedItems: QuickPickItem[] = [];
        totalSteps = totalSteps + 1;
        MultiStep.showQuickPick(weekList, {
            step: 3,
            totalSteps,
            title: '请选择星期',
            placeHolder: '请选择需要进行提醒的星期',
            canPickMany: true,
            ignoreFocusOut: true,
            matchOnDetail: true,
            back: true,
            selectedItems: selectedItems,
            goBack () {
                totalSteps = totalSteps - 1;
            },
            didChangeSelection (res) {
                selectedItems.splice(0, selectedItems.length, ...res);
            },
            $complete: (res, nextStep) => {
                if (res.length === 0) {
                    showProgressByTime("未选择星期", messageBoxShowTime);
                    return;
                }
                callback(res.map(item => item.index).sort());
                nextStep();
            }
        });
    }

    /** 输入指定年月日 */
    function _writeSpecifyDay (today: number, callback: (date: string) => void | false) {
        const dayString = getDate(new Date(today), "YYYY-MM-DD");
        totalSteps = totalSteps + 1;
        MultiStep.showInputBox({
            step: 3,
            totalSteps,
            title: '请输入年月日',
            placeHolder: '以[-/]连接年月日的数据',
            prompt: `如：${dayString}  `,
            value: dayString,
            back: true,
            goBack () {
                totalSteps = totalSteps - 1;
            },
            $complete: (res, nextStep) => {
                if (!res) {
                    return;
                }
                const state = callback(res);
                if (state === false) {
                    return;
                }
                nextStep();
            }
        }, (text) => {
            if (!dateCheck.test(text)) {
                return "年月日格式错误";
            }
            const matchResult = text.match(dateCheck)!.splice(1, 3);
            if (!isDateExist(matchResult[0], matchResult[1], matchResult[2])) {
                return `日期：“${text}”不存在`;
            }
            return "";
        });
    }

    /** 当天，需要判断时间是否超过 */
    function _today (timestamp: number, nowTimestamp: number) {
        if (timestamp < nowTimestamp) {
            showProgressByTime(`【${getDate(timestamp, clockFullInfoType)}】不能设置过去的时间`, messageBoxShowTime);
            return false;
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
                showProgressByTime(`【${getDate(settingTime, clockFullInfoType)}】不能设置过去的时间`, messageBoxShowTime);
                return false;
            }
            _writeInfo(settingTime, void 0);
        });
    }

    /** 输入提示信息 */
    function _writeInfo (timestamp: number, cycle: AlarmClockRecordItemTask["cycle"]) {
        MultiStep.showInputBox({
            step: totalSteps,
            totalSteps: totalSteps,
            title: '请输入提醒内容',
            placeHolder: "请输入",
            back: true,
            async $complete (text, nextStep) {
                await createAlarmClock(timestamp, text??"", cycle);
                const hide = nextStep(true);
                hide();
            }
        }, (text) => {
            if (text.length > 100) {
                return "输入字数不能超过一百字";
            }
            return "";
        });
    }

    // 打开面板
    createQuickPick([{
        label: '新建闹钟',
    }], {
        placeholder: "闹钟信息",
        ignoreFocusOut: true,
        buttons: [createQuickButton("create", { id: "add" }, "新建闹钟/Create alarm clock")],
        didTriggerButton (res: unknown) {
            if (res && (res as QuickPickItem & { id: string }).id === 'create') {
                _create();
            }
        }
    });
}
