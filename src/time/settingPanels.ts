import { showProgressByTime, MultiStep } from "../utils/interactive";
import { weeksName as weeks, accurateTime, changeHourTo24, cycleCalculate, isDateExist } from "./utils";
import type { 
    AlarmClockRecordItemTask, 
    CreateAlarmClockCallback, 
    CreateTimeInputSteps, 
    SettingOptionsAllTypes, 
    SettingOptionsCallbackParams, 
    SettingOptionsCallbackType, 
    SettingOptionsExcludeType, 
    SettingOptionsIsPromise, 
    SettingOptionsType, 
    SpecificWeek 
} from "./types";
import { CycleItem } from "./cycle";
import { QuickInputButtons, type QuickPickItem } from "vscode";
import { getDate } from "../utils";

/**
 * 初始化设置面板
 */
export default function settingInit ({
    createAlarmClock,
    clockFullInfoType
}: {
    createAlarmClock: CreateAlarmClockCallback, 
    clockFullInfoType: string, 
}) {
    /** 校验时间格式，连接符：[:] */
    const timeCheck = /(?:^([1-9]|0[1-9]|1[0-9]|2[0-4]):([0-9]|0[0-9]|[1-5][0-9])$)|(?:^([1-9]|0[1-9]|1[0-2]):([0-9]|0[0-9]|[1-5][0-9])\s*[pPaA]$).*/;

    /** 校验年月日格式 */
    const dateCheck = /^(\d{4})[\-\/]([1-9]|0[1-9]|1[0-2])[\-\/]([1-9]|0[1-9]|[1-2][0-9]|3[01])$/;

    /** 提示弹框显示时间 */
    const messageBoxShowTime = 5000;

    /**
     * 创建新闹钟，输入时间
     * @param _call 返回键调用此函数
     */
    function _create (_call: Function, defaultNext: true, stepSetting?: CreateTimeInputSteps, value?: string): Promise<SettingOptionsType<SettingOptionsAllTypes>>;
    function _create (_call: Function, defaultNext: false, stepSetting?: CreateTimeInputSteps, value?: string): Promise<string>;
    function _create (_call: Function, defaultNext: boolean, stepSetting?: CreateTimeInputSteps, value?: string) {
        return new Promise(resolve => {
            MultiStep.showInputBox({
                ...(stepSetting ? {
                    step: stepSetting.step,
                    totalSteps: stepSetting.totalSteps
                } : {}),
                value,
                title: "请输入时间",
                prompt: "格式为：时:分；如：9:05/9:05 P  ",
                placeHolder: "时和分的连接符是 : ；如果是12小时制，需要在最后写上p或a表示时段",
                regexp: timeCheck,
                error: "时间格式错误",
                $back: true,
                $proxy: true,
                $backButton: true,
                $triggerButton (item) {
                    if (item === QuickInputButtons.Back) {
                        // 时间输入框添加返回按钮返回主面板
                        _call();
                        this.hide();
                    }
                },
                $complete: async (res, nextStep) => {
                    if (!res) {
                        return;
                    }
                    nextStep();
                    if (defaultNext) {
                        const settingResult = await _options(res, defaultNext, stepSetting ? { step: stepSetting.step + 1, totalSteps: stepSetting.totalSteps } : void 0);
                        return resolve(settingResult);
                    }
                    resolve(res);
                }
            });
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
            $callback: callMap[index] as (SettingOptionsCallbackType),
            description: descriptions[index],
            index
        };
    });
    (callMap as unknown) = null, (descriptions as unknown) = null;
    /**
     * 打开操作选项
     */
    function _options (time: string, defaultNext: true, stepSetting?: CreateTimeInputSteps): Promise<SettingOptionsType<SettingOptionsAllTypes>>;
    function _options (time: string, defaultNext: false, stepSetting?: CreateTimeInputSteps): Promise<SettingOptionsExcludeType<SettingOptionsAllTypes>>;
    function _options (time: string, defaultNext: boolean, stepSetting?: CreateTimeInputSteps) {
        time = changeHourTo24(time, ":");
        const activeItem: QuickPickItem[] = [];
        return new Promise(resolve => {
            MultiStep.showQuickPick(infoList, {
                ...(stepSetting ? {
                    step: stepSetting.step,
                    totalSteps: stepSetting.totalSteps
                } : {}),
                title: '请选择设置方式',
                placeHolder: `当前预设置时间：${time}`,
                ignoreFocusOut: true,
                matchOnDetail: true,
                activeItems: activeItem,
                $back: true,
                $complete: async (res, nextStep) => {
                    if (!res) {
                        return;
                    }
                    // 返回false则不进行下一步的跳转
                    const state = await res.$callback(
                        { defaultNext, stepSetting: stepSetting ? { step: stepSetting.step, totalSteps: stepSetting.totalSteps } : void 0 }, 
                        accurateTime(new Date(getDate(Date.now(), `YYYY-MM-DD ${time}:00`)).getTime()), 
                        Date.now(), 
                        time
                    );
                    if (state === false) {
                        return;
                    }
                    activeItem.splice(0, activeItem.length, res);
                    nextStep();
                    state().then(result => {
                        resolve(result);
                    });
                }
            });
        });
    }

    /** 当天，需要判断时间是否超过 */
    function _today (options:{defaultNext:true}, timestamp: number, nowTimestamp: number): Promise<SettingOptionsIsPromise<SettingOptionsType<void>>>;
    function _today (options:{defaultNext:false}, timestamp: number, nowTimestamp: number): Promise<SettingOptionsIsPromise<SettingOptionsExcludeType<void>>>;
    function _today (options:{defaultNext:boolean}, timestamp: number, nowTimestamp: number): Promise<false>;
    function _today ({
        defaultNext,
        stepSetting
    }: SettingOptionsCallbackParams, timestamp: number, nowTimestamp: number) {
        return new Promise(resolve => {
            const overCallback = () => {
                return new Promise(async inserResolve => {
                    if (timestamp < nowTimestamp) {
                        showProgressByTime(`【${getDate(timestamp, clockFullInfoType)}】不能设置过去的时间`, messageBoxShowTime);
                        return resolve(false);
                    }
                    if (defaultNext) {
                        const taskInfo = await _writeInfo(timestamp, void 0, stepSetting ? { 
                            step: stepSetting.step + 1, 
                            totalSteps: stepSetting.totalSteps 
                        } : void 0);
                        return inserResolve({
                            timestamp,
                            taskInfo,
                            cycle: void 0
                        });
                    }
                    inserResolve({
                        timestamp,
                        cycle: void 0
                    });
                });
            };
            resolve(overCallback);
        });
    }

    /** 每天提醒 */
    function _everyDay (options:{defaultNext:true}, timestamp: number, nowTimestamp: number): Promise<SettingOptionsIsPromise<SettingOptionsType<CycleItem.DAY>>>;
    function _everyDay (options:{defaultNext:false}, timestamp: number, nowTimestamp: number): Promise<SettingOptionsIsPromise<SettingOptionsExcludeType<CycleItem.DAY>>>;
    function _everyDay ({
        defaultNext,
        stepSetting
    }: SettingOptionsCallbackParams, timestamp: number, nowTimestamp: number) {
        return new Promise(resolve => {
            const overCallback = () => {
                return new Promise(async inserResolve => {
                    if (timestamp < nowTimestamp) {
                        // 设置的日期已经小于当前时间，则插入数据时间设置为第二天
                        timestamp = cycleCalculate(timestamp, CycleItem.DAY);
                    }
                    if (defaultNext) {
                        const taskInfo = await _writeInfo(timestamp, CycleItem.DAY, stepSetting ? { 
                            step: stepSetting.step + 1, 
                            totalSteps: stepSetting.totalSteps 
                        } : void 0);
                        return inserResolve({
                            timestamp,
                            taskInfo,
                            cycle: CycleItem.DAY
                        });
                    }
                    inserResolve({
                        timestamp,
                        cycle: CycleItem.DAY
                    });
                });
            };
            resolve(overCallback);
        });
    }

    /** 每周提醒 */
    function _everyWeek (options:{defaultNext:true}, timestamp: number, nowTimestamp: number): Promise<SettingOptionsIsPromise<SettingOptionsType<CycleItem.WEEK>>>;
    function _everyWeek (options:{defaultNext:false}, timestamp: number, nowTimestamp: number): Promise<SettingOptionsIsPromise<SettingOptionsExcludeType<CycleItem.WEEK>>>;
    function _everyWeek ({
        defaultNext,
        stepSetting
    }: SettingOptionsCallbackParams, timestamp: number, nowTimestamp: number) {
        return new Promise(resolve => {
            const overCallback = () => {
                return new Promise(async inserResolve => {
                    if (timestamp < nowTimestamp) {
                        // 设置的日期已经小于当前时间，则插入数据时间设置为第二周
                        timestamp = cycleCalculate(timestamp, CycleItem.WEEK);
                    }
                    if (defaultNext) {
                        const taskInfo = await _writeInfo(timestamp, CycleItem.WEEK, stepSetting ? { 
                            step: stepSetting.step + 1, 
                            totalSteps: stepSetting.totalSteps 
                        } : void 0);
                        return inserResolve({
                            timestamp,
                            taskInfo,
                            cycle: CycleItem.WEEK
                        });
                    }
                    inserResolve({
                        timestamp,
                        cycle: CycleItem.WEEK
                    });
                });
            };
            resolve(overCallback);
        });
    }

    /** 指定星期提醒 */
    function _specifyWeek (options:{defaultNext:true}, timestamp: number, nowTimestamp: number): Promise<SettingOptionsIsPromise<SettingOptionsType<SpecificWeek[]>>>;
    function _specifyWeek (options:{defaultNext:false}, timestamp: number, nowTimestamp: number): Promise<SettingOptionsIsPromise<SettingOptionsExcludeType<SpecificWeek[]>>>;
    function _specifyWeek ({
        defaultNext,
        stepSetting
    }: SettingOptionsCallbackParams, timestamp: number, nowTimestamp: number) {
        return new Promise(resolve => {
            const overCallback = () => {
                return new Promise(inserResolve => {
                    _selectWeeks((weekList, stepSettingChild) => {
                        return new Promise(async callResolve => {
                            const nowWeek = new Date(nowTimestamp).getDay() as SpecificWeek;
                            if (timestamp <= nowTimestamp || !weekList.includes(nowWeek)) {
                                // 选择的星期不包括今天或者时间大于当前，插入下一天的时间戳
                                timestamp = cycleCalculate(timestamp, weekList);
                            }
                            callResolve();
                            if (defaultNext) {
                                const taskInfo = await _writeInfo(timestamp, weekList, stepSettingChild ? { 
                                    step: stepSettingChild.step, 
                                    totalSteps: stepSettingChild.totalSteps
                                } : void 0);
                                return inserResolve({
                                    timestamp,
                                    taskInfo,
                                    cycle: weekList
                                });
                            }
                            inserResolve({
                                timestamp,
                                cycle: weekList
                            });
                        });
                    }, stepSetting ? { 
                        step: stepSetting.step + 1, 
                        totalSteps: stepSetting.totalSteps + 1
                    } : void 0);
                });
            };
            resolve(overCallback);
        });
    }

    /** 指定年月日的时间提醒 */
    function _specifyDay (options:{defaultNext:true}, timestamp: number, nowTimestamp: number, inputTime: string): Promise<SettingOptionsIsPromise<SettingOptionsType<void>>>;
    function _specifyDay (options:{defaultNext:false}, timestamp: number, nowTimestamp: number, inputTime: string): Promise<SettingOptionsIsPromise<SettingOptionsExcludeType<void>>>;
    function _specifyDay ({
        defaultNext,
        stepSetting
    }: SettingOptionsCallbackParams, timestamp: number, nowTimestamp: number, inputTime: string) {
        return new Promise(resolve => {
            const overCallback = () => {
                return new Promise(inserResolve => {
                    _writeSpecifyDay(nowTimestamp, (date, stepSettingChild) => {
                        return new Promise(async callResolve => {
                            const settingTime = new Date(`${date} ${inputTime}:00`).getTime();
                            if (settingTime < nowTimestamp) {
                                showProgressByTime(`【${getDate(settingTime, clockFullInfoType)}】不能设置过去的时间`, messageBoxShowTime);
                                return callResolve(false);
                            }
                            callResolve();
                            if (defaultNext) {
                                const taskInfo = await _writeInfo(settingTime, void 0, stepSettingChild ? { 
                                    step: stepSettingChild.step, 
                                    totalSteps: stepSettingChild.totalSteps
                                } : void 0);
                                return inserResolve({
                                    timestamp: settingTime,
                                    taskInfo,
                                    cycle: void 0
                                });
                            }
                            inserResolve({
                                timestamp: settingTime,
                                cycle: void 0
                            });
                        });
                    }, stepSetting ? { 
                        step: stepSetting.step + 1, 
                        totalSteps: stepSetting.totalSteps + 1
                    } : void 0);
                });
            };
            resolve(overCallback);
        });
    }

    /** 输入提示信息 */
    function _writeInfo (timestamp: number, cycle: AlarmClockRecordItemTask["cycle"], stepSetting?: CreateTimeInputSteps): Promise<string> {
        return new Promise(resolve => {
            MultiStep.showInputBox({
                ...(stepSetting ? {
                    step: stepSetting.step,
                    totalSteps: stepSetting.totalSteps,
                } : {}),
                title: '请输入提醒内容',
                placeHolder: "请输入",
                $back: true,
                async $complete (text, nextStep) {
                    await createAlarmClock(timestamp, text??"", cycle);
                    // 调用hide方法
                    nextStep(true)?.();
                    resolve(text);
                }
            }, (text) => {
                if (text.length > 100) {
                    return "输入字数不能超过一百字";
                }
                return "";
            });
        });
    }

    /** 选择指定星期 */
    function _selectWeeks (callback: (list: SpecificWeek[], stepSettingChild?: CreateTimeInputSteps) => Promise<void>, stepSetting?: CreateTimeInputSteps) {
        /** 星期列表 */
        const weekList = [...weeks.slice(1), ...weeks.slice(0, 1)].map((item, index) => {
            return {
                label: '周' + item,
                index: index < 6 ? index + 1 : 0
            } as {
                label: string;
                index: SpecificWeek;
            };
        });
        const selectedItems: QuickPickItem[] = [];
        MultiStep.showQuickPick(weekList, {
            ...(stepSetting ? {
                step: stepSetting.step,
                totalSteps: stepSetting.totalSteps
            } : {}),
            title: '请选择星期',
            placeHolder: '请选择需要进行提醒的星期',
            canPickMany: true,
            ignoreFocusOut: true,
            matchOnDetail: true,
            $back: true,
            selectedItems: selectedItems,
            didChangeSelection (res) {
                selectedItems.splice(0, selectedItems.length, ...res);
            },
            $complete: async (res, nextStep) => {
                if (res.length === 0) {
                    showProgressByTime("未选择星期", messageBoxShowTime);
                    return;
                }
                await callback(res.map(item => item.index).sort(), stepSetting ? {
                    step: stepSetting.step + 1,
                    totalSteps: stepSetting.totalSteps,
                } : void 0);
                nextStep();
            }
        });
    }

    /** 输入指定年月日 */
    function _writeSpecifyDay (today: number, callback: (date: string, stepSettingChild?: CreateTimeInputSteps) => Promise<void | false>, stepSetting?: CreateTimeInputSteps) {
        const dayString = getDate(new Date(today), "YYYY-MM-DD");
        MultiStep.showInputBox({
            ...(stepSetting ? {
                step: stepSetting.step,
                totalSteps: stepSetting.totalSteps
            } : {}),
            title: '请输入年月日',
            placeHolder: '以[-/]连接年月日的数据',
            prompt: `如：${dayString}  `,
            value: dayString,
            $back: true,
            $complete: async (res, nextStep) => {
                if (!res) {
                    return;
                }
                const state = await callback(res, stepSetting ? {
                    step: stepSetting.step + 1,
                    totalSteps: stepSetting.totalSteps,
                } : void 0);
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

    return {
        _create,
        defaultSteps: { step: 1, totalSteps: 3 } as CreateTimeInputSteps
    };
}