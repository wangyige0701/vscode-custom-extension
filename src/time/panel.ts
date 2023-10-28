import { QuickInputButtons, QuickPickItemKind, type QuickPickItem, QuickPickItemButtonEvent } from "vscode";
import { arabicNumeralsToChinese, getDate, isArray, isNumber } from "../utils";
import { createQuickPick, createThemeIcon, showMessage } from "../utils/interactive";
import type { AlarmClockRecordItemTask, CreateAlarmClockCallback } from "./types";
import { weeksName as weeks, cycleInfo } from "./utils";
import { createQuickButton } from "../utils/interactive/button";
import { clockRecord, clockRecordMap, searchByTimestamp } from "./storage";
import { errlog } from "../error";
import type { QuickPickItemsOptions } from "../utils/interactive/types";
import settingInit from "./settingPanels";

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
    /** 创建新闹钟的对象初始化 */
    const settingPanelTarget = settingInit({ createAlarmClock, clockFullInfoType });

    /** 方法解构 */
    const { _create, defaultSteps } = settingPanelTarget;

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

    /**
     * 闹钟任务内容编辑
     */
    function _alarmTaskEdit () {}

    /** 闹钟详情列表数据渲染 */
    function _alarmInfoRenderList (task: AlarmClockRecordItemTask[]): QuickPickItemsOptions[] {
        return task.length > 0 ? task.map((item, index) => {
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
                ]
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
        searchByTimestamp(timestamp).then(([exits, data]) => {
            if (!exits) {
                showMessage({
                    message: `【${option.label}】闹钟数据不存在`,
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
                    const id = (res as QuickPickItemButtonEvent<QuickPickItem> & { id: string }).id;
                    if (!id) {
                        return;
                    }
                    const index = +id.split("-")[1];
                    if (id.startsWith("editTime-")) {
                        // 修改任务时间
                        _create(() => _alarmClockDetail(option), false, {
                            step: 0,
                            totalSteps: 0
                        }, getDate(timestamp, "hh:mm"));
                    } else if (id.startsWith("editCycle-")) {

                    } else if (id.startsWith("editInfo-")) {

                    } else if (id.startsWith("delete-")) {

                    }
                }
            });
        }).catch(errlog);
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
        const renderList = _rederList();
        // 过滤选中的元素
        const select = posi && isNumber(posi) ? renderList.find(item => item && item.$index === posi) : void 0;
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
            didTriggerButton (res: unknown) {
                if (res && (res as QuickPickItem & { id: string }).id === 'create') {
                    _create(_open, true, defaultSteps);
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