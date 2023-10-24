import { $rej, errlog } from "../error";
import { delay, getDate } from "../utils";
import { showProgress } from "../utils/interactive";
import { copyFileWhenVersionChange } from "../version/versionChange";
import { openOperationPanel } from "./openPanel";
import { clockRecord, deleteByTimestamp, fileInit, searchByTimestamp, settintByTimestamp, storagePath } from "./storage";
import type { AlarmClockRecordItemTask } from "./types";
import { accurateTime, cycleCalculate } from "./utils";

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
            for (const time of clockRecord) {
                if (time < nowTime) {
                    await checkInit(time);
                    continue;
                }
                if (time === nowTime) {
                    searchByTimestamp(time).then(([_, { task }]) => {
                        taskHandle(time, task);
                    }).catch(errlog);
                    break;
                }
                break;
            }
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
    if (clockRecord[0] > timestamp) {
        return;
    }
    for (const time of clockRecord) {
        if (time > timestamp) {
            // 大于触发时间跳出循环
            break;
        }
        if (time < timestamp) {
            // 小于触发时间的时间戳进行删除
            deleteTask(time);
            continue;
        }
        searchByTimestamp(time).then(([_, { task }]) => {
            taskHandle(time, task);
        });
    }
}

/**
 * 开启面板设置闹钟
 */
export function settingAlarmClock () {
    openOperationPanel((timestamp: number, info: string, cycle: AlarmClockRecordItemTask["cycle"]) => {
        showProgress({
            title: '正在设置闹钟',
            location: 'Notification'
        }, (progress) => <Promise<void>>new Promise(resolve => {
            insertTask(timestamp, info, cycle).then(() => {
                progress.report({
                    message: `[${getDate(timestamp)}] 设置完成`,
                    increment: 100
                });
                return delay(3000);
            }).then(resolve);
        }));
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
                await settintByTimestamp(newTimestamp, val.info, val.cycle).catch(errlog);
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
    return settintByTimestamp(timestamp, info, cycle);
}

/**
 * 任务列表处理，遍历开启任务，完成后删除
 */
function taskHandle (timestamp: number, task: AlarmClockRecordItemTask[]) {
    task.forEach(item => {
        openAlarmClock(timestamp, item.info, item.cycle);
    });
    deleteTask(timestamp);
}

/**
 * 删除一个任务
 */
async function deleteTask (timestamp: number) {
    deleteByTimestamp(timestamp).catch(errlog);
}

/**
 * 开启一个闹钟
 */
async function openAlarmClock (timestamp: number, info: string, cycle: AlarmClockRecordItemTask["cycle"]) {
    // 显示闹钟信息
    console.log(info);
    
    // 判断是否重新插入
    if (cycle) {
        const nextTimestamp = cycleCalculate(timestamp, cycle);
        if (!nextTimestamp) {
            return;
        }
        insertTask(nextTimestamp, info, cycle).catch(errlog);
    }
}

/**
 * 刷新函数
 */
function refresh () {}