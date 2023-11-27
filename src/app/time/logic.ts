import type { AlarmClockRecordItemTask, UpdateTimestampTarget } from "./types";
import { $rej, errlog } from "../../error";
import { arabicNumeralsToChinese, delay, getDate } from "../../utils";
import { showProgress } from "../../common/interactive";
import { copyFileWhenVersionChange } from "../../version";
import { showAlarmClockInfo } from "./prompt";
import { clockRecord, deleteByTimestamp, fileInit, searchByTimestamp, addByTimestamp, storagePath, updateSthInTimstamp, deleteTaskInTimestamp } from "./storage";
import { accurateTime, cycleCalculate } from "./utils";
import openAlarmClockPanel from "./panel";

/** 显示的时间格式 */
const clockFullInfoType = "YYYY年MM月DD日 hh时mm分";

/** 进度条延长显示的时间 */
const progressDelayTime = 500;

/**
 * 闹钟配置初始化
 */
export function initAlarmClock (): Promise<void> {
    return new Promise((resolve, reject) => {
        const nowTime = accurateTime(Date.now());
        copyFileWhenVersionChange(storagePath.join('/')).then(() => {
            return fileInit();
        }).then(async () => {
            // 数据校验，去除超时的
            clockRecord.forEach(async (time, index, toBreak) => {
                if (time < nowTime) {
                    await checkInit(time);
                    return;
                }
                if (time === nowTime) {
                    searchByTimestamp(time).then(([, { task }]) => {
                        taskHandle(time, task);
                    }).catch(errlog);
                    return toBreak("BREAK");
                }
                return toBreak("BREAK");
            });
            resolve();
        }).catch(err => {
            reject($rej(err, initAlarmClock.name));
        });
    });
}

/**
 * 每分钟触发一次，检测忽略秒数误差后的时间是否大于等于任务数组的第一位，是则触发
 */
export function trigger (timestamp: number) {
    timestamp = accurateTime(timestamp);
    if (clockRecord.findByIndex(0) > timestamp) {
        return;
    }
    clockRecord.forEach((time, index, toBreak) => {
        if (time > timestamp) {
            // 大于触发时间跳出循环
            return toBreak("BREAK");
        }
        if (time < timestamp) {
            // 小于触发时间的时间戳进行删除
            deleteTimestamp(time);
            return toBreak("BREAK");
        }
        searchByTimestamp(time).then(([, { task }]) => {
            taskHandle(time, task);
        });
    });
}

/**
 * 开启面板设置闹钟
 */
export function settingAlarmClock () {
    openAlarmClockPanel({
        createAlarmClock: async (timestamp: number, info: string, cycle: AlarmClockRecordItemTask["cycle"]) => {
            await showProgress({
                title: '正在设置闹钟',
                location: 'Notification'
            }, (progress) => <Promise<void>>new Promise(resolve => {
                insertTask(timestamp, info, cycle).then(() => {
                    progress.report({
                        message: `【${getDate(timestamp, clockFullInfoType)}】设置完成`,
                        increment: 100
                    });
                    return delay(progressDelayTime);
                }).then(resolve);
            }));
        }, 
        updateAlarmClockTask: async (timestamp: number, index: number, { content, type, nextTime }: UpdateTimestampTarget) => {
            const typeName = {
                "TIME": "时间",
                "CYCLE": "周期",
                "TASK": "任务内容"
            };
            await showProgress({
                title: '正在更新闹钟信息',
                location: 'Notification'
            }, (progress) => <Promise<void>>new Promise(resolve => {
                updateSthInTimstamp(timestamp, index, (
                    type === 'TIME' ? { content, type } : type === 'TASK' ? { content, type } : { content, type, nextTime }
                )).then(() => {
                    progress.report({
                        message: `【${getDate(timestamp, clockFullInfoType)}】${typeName[type]}更新完成`,
                        increment: 100
                    });
                    return delay(progressDelayTime);
                }).then(resolve);
            }));
        }, 
        deleteTimestamp: async (timestamp: number) => {
            await showProgress({
                title: '正在删除闹钟',
                location: 'Notification'
            }, (progress) => <Promise<void>>new Promise(resolve => {
                deleteTimestamp(timestamp).then(() => {
                    progress.report({
                        message: `【${getDate(timestamp, clockFullInfoType)}】删除完成`,
                        increment: 100
                    });
                    return delay(progressDelayTime);
                }).then(resolve);
            }));
        },
        deleteTaskInTimestamp: async (timestamp: number, index: number) => {
            await showProgress({
                title: '正在删除任务',
                location: 'Notification'
            }, (progress) => <Promise<void>>new Promise(resolve => {
                deleteTaskInTimestamp(timestamp, index).then(() => {
                    progress.report({
                        message: `【${getDate(timestamp, clockFullInfoType)}】（任务${arabicNumeralsToChinese(index + 1)}）删除完成`,
                        increment: 100
                    });
                    return delay(progressDelayTime);
                }).then(resolve);
            }));
        },
        clockFullInfoType
    });
}

/**
 * 初始化校验
 */
function checkInit (timestamp: number): Promise<void> {
    return new Promise((resolve) => {
        searchByTimestamp(timestamp).then(async ([exist, { task }]) => {
            if (!exist) {
                deleteByTimestamp(timestamp);
                return;
            }
            for (const val of task) {
                if (!val.cycle) {
                    continue;
                }
                const newTimestamp = cycleCalculate(timestamp, val.cycle);
                if (!newTimestamp) {
                    continue;
                }
                await addByTimestamp(newTimestamp, val.info, val.cycle).catch(errlog);
            }
            resolve();
        }).catch(errlog);
    });
}

/**
 * 插入一条新任务
 */
function insertTask (timestamp: number, info: string = '', cycle: AlarmClockRecordItemTask["cycle"] = void 0) {
    timestamp = accurateTime(timestamp);
    return addByTimestamp(timestamp, info, cycle);
}

/**
 * 任务列表处理，遍历开启任务，完成后删除
 */
function taskHandle (timestamp: number, task: AlarmClockRecordItemTask[]) {
    task.forEach(item => {
        openAlarmClock(timestamp, item.info, item.cycle);
    });
    deleteTimestamp(timestamp);
}

/**
 * 删除一个任务
 */
async function deleteTimestamp (timestamp: number) {
    await deleteByTimestamp(timestamp).catch(errlog);
}

/**
 * 开启一个闹钟
 */
async function openAlarmClock (timestamp: number, info: string, cycle: AlarmClockRecordItemTask["cycle"]) {
    // 显示闹钟信息
    showAlarmClockInfo(getDate(timestamp, clockFullInfoType), info);
    // 判断是否重新插入
    if (cycle) {
        const nextTimestamp = cycleCalculate(timestamp, cycle);
        if (!nextTimestamp) {
            return;
        }
        insertTask(nextTimestamp, info, cycle).catch(errlog);
    }
}