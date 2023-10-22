import type { Uri } from "vscode";
import { $rej } from "../error";
import { copyFileWhenVersionChange } from "../version/versionChange";
import { fileInit, storagePath } from "./storage";
import type { AlarmClockRecordItem, AlarmClockRecordItemTask } from "./types";

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
        }).catch(err => {
            reject($rej(err, init.name));
        });
    });
}

/**
 * 每分钟触发一次，检测忽略秒数误差后的时间是否大于等于任务数组的第一位，是则触发
 */
export function trigger (timestamp: number) {
    timestamp = Math.floor(timestamp / 1000) * 1000;
}

/**
 * 任务处理
 */
function taskHandle () {}

/**
 * 时间戳排序
 */
function sort () {}

/**
 * 插入一条新数据
 */
function insert (timestamp: number, info: string = '', cycle: AlarmClockRecordItemTask["cycle"] = void 0) {}
