import { QuickInputButtons, QuickPickItemKind, type QuickPickItem } from "vscode";
import { arabicNumeralsToChinese, getDate, isNumber } from "../utils";
import { createQuickPick, showProgressByTime, MultiStep, createThemeIcon, showMessage } from "../utils/interactive";
import type { AlarmClockRecordItemTask, CreateAlarmClockCallback, SpecificWeek } from "./types";
import { weeksName as weeks, accurateTime, changeHourTo24, cycleCalculate, isDateExist, cycleInfo } from "./utils";
import { createQuickButton } from "../utils/interactive/button";
import { clockRecord, clockRecordMap, searchByTimestamp } from "./storage";
import { errlog } from "../error";
import type { QuickPickItemsOptions, QuickPickType } from "../utils/interactive/types";

/**
 * 打开设置闹钟的操作面板
*/
export default function openAlarmClockPanel ({
    createAlarmClock, 
    clockFullInfoType, 
    deleteTask
}: {
    createAlarmClock: CreateAlarmClockCallback, 
    clockFullInfoType: string, 
    deleteTask: (timestamp: number) => Promise<void>
}) {
    /** 校验时间格式，连接符：[:] */
    const timeCheck = /(?:^([1-9]|0[1-9]|1[0-9]|2[0-4]):([0-9]|0[0-9]|[1-5][0-9])$)|(?:^([1-9]|0[1-9]|1[0-2]):([0-9]|0[0-9]|[1-5][0-9])\s*[pPaA]$).*/;

    /** 校验年月日格式 */
    const dateCheck = /^(\d{4})[\-\/]([1-9]|0[1-9]|1[0-2])[\-\/]([1-9]|0[1-9]|[1-2][0-9]|3[01])$/;

    /** 提示弹框显示时间 */
    const messageBoxShowTime = 5000;

    /** 总步骤数 */
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
            buttons: [QuickInputButtons.Back],
            triggerButton (item) {
                if (item === QuickInputButtons.Back) {
                    // 时间输入框添加返回按钮返回主面板
                    _open();
                    this.hide();
                }
            },
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
            $callback: callMap[index] as ((timestamp: number, nowTimestamp: number, inputTime: string) => void | false),
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
                const state = res.$callback?.(accurateTime(new Date(getDate(Date.now(), `YYYY-MM-DD ${time}:00`)).getTime()), Date.now(), time);
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
            if (timestamp <= nowTimestamp || !weekList.includes(nowWeek)) {
                // 选择的星期不包括今天或者时间大于当前，插入下一天的时间戳
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

    /**
     * 获取星期数据，相对于当前是本周还是下周
     */
    const _getWeekInfo = (function () {
        const nowTimestamp = Date.now(), nowWeek = new Date(nowTimestamp).getDay();
        const nowSumday = new Date(getDate(nowTimestamp, "YYYY-MM-DD 23:59:59")).getTime() + (7 - (nowWeek === 0 ? 7 : nowWeek)) * 24 * 60 * 60 * 1000;
        return function (timestamp: number) {
            const date = new Date(timestamp);
            const week = date.getDay();
            const weekName = weeks[week];
            const prefix = timestamp > nowSumday ? "下" : "本";
            return `${prefix}周${weekName}`;
        };
    })();

    /** 确认删除 */
    function _confirmDelete (timestamp: number): Promise<void> {
        return new Promise(resolve => {
            showMessage({
                message: "删除闹钟",
                modal: true,
                detail: `是否删除${getDate(timestamp)}的所有任务？`,
                items: [{
                    id: 0,
                    title: '确认'
                }]
            }).then(async res => {
                if (res && res.id === 0) {
                    await deleteTask(timestamp);
                }
                resolve();
            }).catch(errlog);
        });
    }

    /** 闹钟详情列表数据渲染 */
    function _alarmInfoRenderList (task: AlarmClockRecordItemTask[]): QuickPickItemsOptions[] {
        return task.length > 0 ? task.map((item, index) => {
            return {
                label: `任务${arabicNumeralsToChinese(index + 1)}：`,
                description: cycleInfo(item.cycle),
                detail: item.info
            };
        }) : [{
            label: '暂无任务'
        }];
    }

    /**
     * 打开闹钟详情面板
     * @this {QuickPickType}
     */
    function _alarmClockDetail (res: QuickPickItemsOptions) {
        const { $uid: timestamp, $index: posiIndex } = (res as QuickPickItemsOptions & { $uid: number, $index: number});
        searchByTimestamp(timestamp).then(([exits, data]) => {
            if (!exits) {
                showMessage({
                    message: `【${res.label}】闹钟数据不存在`,
                    detail: '点击确认关闭',
                    modal: true,
                    items: [{title: '确认'}]
                }).then(() => {
                    // @ts-ignore 此函数this指向打开的QuickPick面板
                    this.hide();
                });
                return;
            }
            createQuickPick(_alarmInfoRenderList(data.task), {
                title: `【${res.label}】闹钟详情`,
                placeholder: res.description,
                ignoreFocusOut: true,
                buttons: [QuickInputButtons.Back],
                didTriggerButton (res) {
                    if (res && res === QuickInputButtons.Back) {
                        // 返回时传入索引，用于选中上一次点击的元素
                        _open(posiIndex);
                        this.hide();
                    }
                }
            });
        });
    }

    /** 生成渲染列表 */
    function _rederList (): (QuickPickItemsOptions & { $index?: number, $uid?: number })[] {
        const theKind = QuickPickItemKind.Separator;
        const alarmIcon = createThemeIcon("wangyige-alarmClock");
        const result: QuickPickItemsOptions[] = clockRecord.length > 0 ? clockRecord.map((item, index) => {
            return {
                $index: index,
                $uid: item,
                callback: _alarmClockDetail,
                label: getDate(item, clockFullInfoType),
                description: `（${_getWeekInfo(item)}）${clockRecordMap[item]}个任务`,
                iconPath: alarmIcon,
                buttons: [createQuickButton(`delete-${item}`, { id: "trash" }, "删除闹钟/Delete alarm clock")],
            } as QuickPickItemsOptions;
        }) : [{
            label: '暂无闹钟数据',
            description: '点击列表第一项或者点击右上角按钮 $(add) 创建',
        }];
        // 添加固定数据
        result.unshift({
            callback: _create,
            label: "新建闹钟",
            iconPath: createThemeIcon("add"),
            alwaysShow: true
        }, {
            label: "关闭面板",
            iconPath: createThemeIcon("close-all"),
            callback () {
                this.hide();
            },
            alwaysShow: true
        }, {
            label: "闹钟数据",
            kind: theKind
        });
        return result;
    }

    /** 打开面板 */
    function _open (posi?: number) {
        const renderList = _rederList();
        // 过滤选中的元素
        const select = isNumber(posi) ? renderList.find(item => item && item.$index === posi) ?? void 0 : void 0;
        createQuickPick(renderList, {
            placeholder: "闹钟信息",
            ignoreFocusOut: true,
            activeItems: select ? [select] : void 0,
            buttons: [
                QuickInputButtons.Back,
                createQuickButton("create", { id: "add" }, "新建闹钟/Create alarm clock")
            ],
            didTriggerButton (res: unknown) {
                if (res && (res as QuickPickItem & { id: string }).id === 'create') {
                    _create();
                } else {
                    this.hide();
                }
            },
            didTriggerItemButton (res) {
                if (!res) {
                    return;
                }
                const button: unknown = res.button;
                const id = (button as QuickPickItem & { id: string }).id;
                if (id && id.startsWith('delete-')) {
                    _confirmDelete(parseInt(id.split('-')[1])).then(() => {
                        // 更新面板
                        this.items = _rederList();
                        this.show();
                    });
                }
            }
        });
    }

    _open();
}
