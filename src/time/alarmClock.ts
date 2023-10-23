import { $rej, errlog } from "../error";
import { getDate, isArray } from "../utils";
import { copyFileWhenVersionChange } from "../version/versionChange";
import { clockRecord, deleteByTimestamp, fileInit, searchByTimestamp, settintByTimestamp, storagePath } from "./storage";
import type { AlarmClockRecordItemTask, Cycle, SpecificWeek } from "./types";

/** 校验时间格式，时：可以写单数字，也可以在前面添零补位；分：个位数字必须补位；连接符：[/-:] */
const timeCheck = /^([1-9]|0[1-9]|1[0-9]|2[0-4])[\/\-\:](0[0-9]|[1-5][0-9])/;

/**
 * 闹钟配置初始化
 * 1、获取配置数据，
 * 比较时间戳，将超时的时间戳数据删除，同时判断是否有任务需要保留
 * 重新调整的任务时间戳进行重排
 * 2、将排序好的时间戳插入记录数组
 */
export function init (): Promise<void> {
    return new Promise((resolve, reject) => {
        copyFileWhenVersionChange(storagePath.join('/')).then(() => {
            return fileInit();
        }).then(() => {
            resolve();
        }).catch(err => {
            reject($rej(err, init.name));
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
    // 日历：选择某一天，
    // 展示所有闹钟，可以选择删除或者改变状态，可以点击新建跳转创建新闹钟
    // 创建：1、输入时间；2、选择功能（注，时间只能设置时和分）校验时需要判断设置的时间是否小于当前时间
    // 小于则不能设置为当天
    // 功能有：1、设置当天，超时或完成自动删除；2、选择时间星期，一周中的几天；3、每天或者每周的指定星期

}

/**
 * 插入一条新任务
 */
function insertTask (timestamp: number, info: string = '', cycle: AlarmClockRecordItemTask["cycle"] = void 0) {
    timestamp = accurateTime(timestamp);
    settintByTimestamp(timestamp, info, cycle).then(refresh).catch(err => errlog(err));
}

/**
 * 对时间戳进行精确处理，忽略秒数，只返回到分钟的时间戳
 */
function accurateTime (timestamp: number): number {
    return new Date(getDate(timestamp, "YYYY-MM-DD hh:mm:00")).getTime();
}

/**
 * 任务处理
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
    deleteByTimestamp(timestamp).then(refresh).catch(err => errlog(err));
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
 * 根据周期计算新的时间戳
 */
function cycleCalculate (timestamp: number, cycle: Cycle) {
    if (cycle === "DAY") {
        return timestamp + 1000 * 60 * 60 * 24;
    } else if (cycle === "WEEK") {
        return timestamp + 1000 * 60 * 60 * 24 * 7;
    } else if (isArray(cycle)) {
        const w = (new Date(timestamp).getDay()) as SpecificWeek;
        let curr = cycle.indexOf(w), next = curr + 1;
        if (next >= cycle.length ) {
            next = 0;
        }
        if (next === curr) {
            // 日期相同，时间加七天
            return timestamp + 1000 * 60 * 60 * 24 * 7;
        }
        // 时间换算
        next = cycle[next], curr = cycle[curr];
        next = next === 0 ? 7 : next, curr = curr === 0 ? 7 : 0;
        if (next < curr) {
            // 例如：当前周六，下一天周一
            return timestamp + 1000 * 60 * 60 * 24 * (7 - curr + next);
        }
        // 例如：当前周二，下一天周六
        return timestamp + 1000 * 60 * 60 * 24 * (next - curr);
    }
}

/**
 * 刷新函数
 */
function refresh () {}