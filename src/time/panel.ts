import { QuickInputButtons, QuickPickItemKind, QuickInputButton, QuickPickItem, QuickPick } from "vscode";
import { arabicNumeralsToChinese, createExParamPromise, getDate, isNumber, isUndefined } from "../utils";
import { createQuickPick, createThemeIcon, showMessage } from "../utils/interactive";
import type { AlarmClockRecordItemTask, CreateAlarmClockCallback, DeleteTaskInTimestampType, DeleteTimestampType, UpdateAlarmClockTaskCallback } from "./types";
import { weeksName, cycleInfo, changeHourTo24, accurateTime, isTimeLegel } from "./utils";
import { createQuickButton } from "../utils/interactive/button";
import { clockRecord, searchByTimestamp } from "./storage";
import { errlog } from "../error";
import type { QuickPickItemsOptions } from "../utils/interactive/types";
import settingInit from "./settingPanels";

/**
 * 打开设置闹钟的操作面板
 */
export default function openAlarmClockPanel ({
    createAlarmClock, 
    updateAlarmClockTask,
    deleteTimestamp,
    deleteTaskInTimestamp,
    clockFullInfoType
}: {
    createAlarmClock: CreateAlarmClockCallback, 
    updateAlarmClockTask: UpdateAlarmClockTaskCallback,
    deleteTimestamp: DeleteTimestampType,
    deleteTaskInTimestamp: DeleteTaskInTimestampType,
    clockFullInfoType: string
}) {
    /** 创建新闹钟的对象初始化 */
    const settingPanelTarget = settingInit({ createAlarmClock, clockFullInfoType });

    /** 方法解构 */
    const { _create, _options, _writeInfo, defaultSteps } = settingPanelTarget;

    /** id数据处理正则 */
    const resolveId = /^(\w*)\-(\d*)$/;

    /** 系统弹框中的按钮对象 */
    const messageButtons = [{
        id: 0,
        title: '确认'
    }];

    /**
     * 获取星期数据，相对于当前是本周还是下周
     */
    const _getWeekInfo = (function () {
        const nowTimestamp = Date.now(), nowWeek = new Date(nowTimestamp).getDay();
        const nowSumday = new Date(getDate(nowTimestamp, "YYYY-MM-DD 23:59:59")).getTime() + (7 - (nowWeek === 0 ? 7 : nowWeek)) * 24 * 60 * 60 * 1000;
        return function (timestamp: number) {
            const date = new Date(timestamp);
            const week = date.getDay();
            const weekName = weeksName[week];
            const prefix = timestamp > nowSumday ? "下" : "本";
            return `${prefix}周${weekName}`;
        };
    })();

    /** 确认删除 */
    function _confirmDelete (timestamp: number, index?: number): Promise<void> {
        return new Promise(resolve => {
            const deleteAllTask = isUndefined(index);
            showMessage({
                message: deleteAllTask ? "删除闹钟" : "删除任务",
                modal: true,
                detail: `是否删除${getDate(timestamp)}的${deleteAllTask ? "所有任务" : "任务"+arabicNumeralsToChinese(index+1)}？`,
                items: messageButtons
            }).then(async res => {
                if (res && res.id === 0) {
                    if (deleteAllTask) {
                        await deleteTimestamp(timestamp);
                    } else {
                        await deleteTaskInTimestamp(timestamp, index);
                    }
                }
                resolve();
            }).catch(errlog);
        });
    }

    /** 闹钟任务时间修改 */
    function _alarmTaskTimeChange (option: QuickPickItemsOptions, index: number, timestamp: number, task: AlarmClockRecordItemTask) {
        _create(() => _alarmClockDetail(option), false, void 0, getDate(timestamp, "hh:mm")).then(([time, hide]) => {
            time = changeHourTo24(time);
            const settingTimestamp = accurateTime(new Date(getDate(Date.now(), `YYYY-MM-DD ${time}:00`)).getTime());
            const result = isTimeLegel(settingTimestamp, task.cycle);
            if (result === false) {
                showMessage({
                    message: "时间错误",
                    modal: true,
                    detail: `时间不能小于当前时间，请重新输入！`,
                    items: messageButtons
                });
                return createExParamPromise(Promise.resolve(), false, () => {});
            }
            return createExParamPromise(updateAlarmClockTask(timestamp, index, { content: result, type: "TIME" }), true, hide);
        }).then(([_, state, hide]) => {
            hide?.();
            if (state) {
                _open();
            }
        }).catch(errlog);
    }

    /** 闹钟任务周期调整 */
    function _alarmTaskCycleChange (option: QuickPickItemsOptions, index: number, timestamp: number, task: AlarmClockRecordItemTask) {
        _options(() => _alarmClockDetail(option), getDate(timestamp, "hh:mm"), false, void 0).then(([value, hide]) => {
            const result = isTimeLegel(timestamp, value.cycle);
            if (result === false) {
                showMessage({
                    message: "时间错误",
                    modal: true,
                    detail: `时间不能小于当前时间，请重新输入！`,
                    items: messageButtons
                });
                return createExParamPromise(Promise.resolve(), false, () => {});
            }
            return createExParamPromise(updateAlarmClockTask(timestamp, index, { content: value.cycle, type: "CYCLE", nextTime: result }), true, hide);
        }).then(([_, state, hide]) =>{
            hide?.();
            if (state) {
                _open();
            }
        }).catch(errlog);
    }

    /** 闹钟任务内容编辑 */
    function _alarmTaskInfoEdit (option: QuickPickItemsOptions, index: number, timestamp: number, task: AlarmClockRecordItemTask) {
        _writeInfo(() => _alarmClockDetail(option), task.cycle, timestamp, false, void 0).then(([value, hide]) => {
            return createExParamPromise(updateAlarmClockTask(timestamp, index, { content: value, type: "TASK" }), hide);
        }).then(([_, hide]) => {
            hide?.();
            _alarmClockDetail(option);
        }).catch(errlog);
    }

    /** 闹钟任务删除 */
    function _alarmTaskDelete (
        option: QuickPickItemsOptions, 
        index: number, 
        timestamp: number, 
        task: AlarmClockRecordItemTask, 
        renderList: QuickPickItemsOptions[], 
        allTasks: AlarmClockRecordItemTask[], 
        quick: QuickPick<QuickPickItem>
    ) {
        _confirmDelete(timestamp, index).then(() => {
            if (quick && allTasks.length > 0) {
                allTasks.splice(index, 1);
                // 重置列表数据
                renderList.splice(0, renderList.length, ..._alarmInfoRenderList(timestamp, allTasks));
                quick.items = renderList;
                return;
            }
            _open();
        });
    }

    const alarmTaskCallbacks = {
        editTime: _alarmTaskTimeChange,
        editCycle: _alarmTaskCycleChange,
        editInfo: _alarmTaskInfoEdit,
        delete: _alarmTaskDelete
    };

    /** 闹钟详情列表数据渲染 */
    function _alarmInfoRenderList (timestamp: number, tasks: AlarmClockRecordItemTask[]): QuickPickItemsOptions[] {
        return tasks.length > 0 ? tasks.map((item, index) => {
            return {
                label: `任务${arabicNumeralsToChinese(index + 1)}：`,
                description: cycleInfo(item.cycle),
                detail: item.info,
                iconPath: createThemeIcon("chevron-right"),
                buttons: [
                    createQuickButton(`editTime-${index}`, createThemeIcon("wangyige-clock"), "修改任务时间"),
                    createQuickButton(`editCycle-${index}`, createThemeIcon("clock"), "修改任务周期"),
                    createQuickButton(`editInfo-${index}`, createThemeIcon("pencil"), "编辑任务内容"),
                    createQuickButton(`delete-${index}`, createThemeIcon("trash"), "删除任务"),
                ].map(item => {
                    return {
                        ...item,
                        timestamp,
                        task: tasks[index],
                        tasks
                    };
                })
            };
        }) : [{
            label: '暂无任务'
        }];
    }

    /**
     * 打开闹钟详情面板
     * @this {QuickPickType}
     */
    function _alarmClockDetail (option: QuickPickItemsOptions) {
        const { $uid: timestamp, $index: posiIndex } = (option as QuickPickItemsOptions & { $uid: number, $index: number});
        const renderList: QuickPickItemsOptions[] = [{
            label: '数据检索中'
        }];
        let quick = createQuickPick(renderList, {
            title: `【${option.label}】闹钟详情`,
            placeholder: option.description,
            ignoreFocusOut: true,
            matchOnDetail: true,
            buttons: [QuickInputButtons.Back],
            didTriggerButton (res) {
                if (res && res === QuickInputButtons.Back) {
                    // 返回时传入索引，用于选中上一次点击的元素
                    _open(posiIndex);
                    this.hide();
                }
            },
            async didTriggerItemButton (res) {
                if (!res) { return; }
                const theButton = res.button;
                const { id, timestamp: theTimestamp, task: theTask, tasks: allTasks } = (theButton as QuickInputButton & { 
                    id: string; 
                    timestamp: number; 
                    task: AlarmClockRecordItemTask; 
                    tasks: AlarmClockRecordItemTask[];
                });
                if (!id) { return; }
                const matchResult = id.match(resolveId);
                if (!matchResult) { return; }
                const [_, idName, idIndex] = matchResult;
                const _runFunc = alarmTaskCallbacks[idName as "editTime" | "editCycle" | "editInfo" | "delete"];
                if (!_runFunc) { return; }
                _runFunc(option, +idIndex, theTimestamp, theTask, renderList, allTasks, quick);
            }
        });
        // 动态加载
        searchByTimestamp(timestamp).then(([exits, data]) => {
            if (!exits) {
                showMessage({
                    message: `【${option.label}】闹钟数据不存在`,
                    detail: '点击确认关闭',
                    modal: true,
                    items: messageButtons
                }).then(() => {
                    // @ts-ignore 此函数this指向打开的QuickPick面板
                    quick.hide();
                    renderList.splice(0, renderList.length);
                    (quick as unknown) = null;
                });
                return;
            }
            renderList.splice(0, renderList.length, ..._alarmInfoRenderList(data.timestamp, data.task));
            quick.items = renderList;
        }).catch(errlog);
    }

    /** 生成渲染列表 */
    function _rederList (): (QuickPickItemsOptions & { $index?: number, $uid?: number })[] {
        const theKind = QuickPickItemKind.Separator;
        const alarmIcon = createThemeIcon("wangyige-alarmClock");
        const result: QuickPickItemsOptions[] = clockRecord.length > 0 ? clockRecord.origin.map((item, index) => {
            return {
                $index: index,
                $uid: item,
                callback: _alarmClockDetail,
                label: getDate(item, clockFullInfoType),
                description: `（${_getWeekInfo(item)}）${clockRecord.taskNumber(item)}个任务`,
                iconPath: alarmIcon,
                buttons: [createQuickButton(`delete-${item}`, { id: "trash" }, "删除闹钟/Delete alarm clock")],
            } as QuickPickItemsOptions;
        }) : [{
            label: '暂无闹钟数据',
            description: '点击列表第一项或者点击右上角按钮 $(add) 创建',
        }];
        // 添加固定数据
        result.unshift({
            callback: () => {
                _create(_open, true, defaultSteps);
            },
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
        let renderList = _rederList();
        // 过滤选中的元素
        let select = posi && isNumber(posi) ? renderList.find(item => item && item.$index === posi) : void 0;
        createQuickPick(renderList, {
            placeholder: "闹钟信息",
            ignoreFocusOut: true,
            ...(select ? {
                activeItems: [select]
            } : {}),
            buttons: [
                QuickInputButtons.Back,
                createQuickButton("create", { id: "add" }, "新建闹钟/Create alarm clock")
            ],
            didTriggerButton (res) {
                if (!res) {
                    return;
                }
                const id = (res as QuickInputButton & { id: string }).id;
                if (id === 'create') {
                    _create(_open, true, defaultSteps);
                } else {
                    this.hide();
                }
            },
            didTriggerItemButton (res) {
                if (!res) { return; }
                const button = res.button;
                const id = (button as QuickInputButton & { id: string }).id;
                if (id && id.startsWith('delete-')) {
                    _confirmDelete(parseInt(id.split('-')[1])).then(() => {
                        // 更新面板
                        this.items = _rederList();
                        this.show();
                    });
                }
            }
        });
        (renderList as unknown) = null, (select as unknown) = void 0;
    }

    _open();
}