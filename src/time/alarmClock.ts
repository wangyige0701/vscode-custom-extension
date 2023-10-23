import { $rej, errlog } from "../error";
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
    console.log("setting");
    // 打开输入框设置闹钟时间
    // 展示所有闹钟，可以选择删除或者改变状态，可以点击新建跳转创建新闹钟
    // 创建：1、输入时间；2、选择功能（注，时间只能设置时和分）校验时需要判断设置的时间是否小于当前时间
    // 小于则不能设置为当天
    // 功能有：1、设置当天，超时或完成自动删除；2、选择时间星期，一周中的几天；3、每天或者每周的指定星期；4、设置年月日
    openOperationPanel();
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
    settintByTimestamp(timestamp, info, cycle).then(refresh).catch(errlog);
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
    deleteByTimestamp(timestamp).then(refresh).catch(errlog);
}

/**
 * 开启一个闹钟
 */
async function openAlarmClock (timestamp: number, info: string, cycle: AlarmClockRecordItemTask["cycle"]) {
    // 显示闹钟信息
    // 判断是否重新插入
    if (cycle) {
        const nextTimestamp = cycleCalculate(timestamp, cycle);
        if (!nextTimestamp) {
            return;
        }
        insertTask(nextTimestamp, info, cycle);
    }
}

/**
 * 刷新函数
 */
function refresh () {}