import type { Uri } from "vscode";
import { createBuffer, createDirectoryUri, isFileExits, isFileExitsSync, joinPathUri, readFileUri, uriDelete, writeFileUri } from "../utils/file";
import { bisectionAsce } from "../utils/algorithm";
import ExtensionUri from "../utils/system/extension";
import { $rej } from "../error";
import type { AlarmClockRecordItem, AlarmClockRecordItemTask } from "./types";
import { isNumber } from "../utils";

/** 闹钟时间数据记录数组，元素为时间戳，升序排列 */
export const clockRecord: number[] = [];

/** 某一时刻的闹钟数量 */
export const clockRecordMap: { [key: string]: number } = {};

/** 储存闹钟数据的文件夹 */
export const storagePath = ["resources", "alarmclock"];

/** 基础数据记录文件名 */
const basicFile = '.basic';

/** 匹配时间戳数据 */
const mathcAllTimeRegexp = /(?:(\d{10,13})(?:{(\d*)})?)/g;

/**
 * ini文件初始化，如果不存在则进行创建，存在则获取所有时间戳的数据
 */
export function fileInit (): Promise<void> {
    /** 对记录的数据进行校验 */
    async function _check (pathUri: Uri) {
        let refresh = false, i = 0, length = clockRecord.length;
        for (; i < length; i++) {
            const time = clockRecord[i];
            if (!isFileExitsSync(joinPathUri(pathUri, time.toString()))) {
                remove(time);
                refresh = true;
                i--, length--;
            }
        }
        if (refresh) {
            await refreshBasicData();
        }
    }
    return new Promise((resolve, reject) => {
        const fileUri = joinPathUri(ExtensionUri.get, ...storagePath),
        retrievalUri = joinPathUri(fileUri, basicFile);
        isFileExits(fileUri).then(state => {
            if (!state) {
                return createDirectoryUri(fileUri);
            }
        }).then(async () => {
            if (!isFileExitsSync(retrievalUri)) {
                const fileContent = '';
                await writeFileUri(retrievalUri, createBuffer(fileContent));
                return fileContent;
            }
            const fileContent = await readFileUri(retrievalUri);
            return fileContent.toString();
        }).then(async res => {
            basicDataHandle(res);
            await _check(fileUri);
            resolve();
        }).catch(err => {
            reject($rej(err, fileInit.name));
        });
    });
}

/**
 * 根据时间戳查询数据
 * @param timestamp 时间戳
 * @param path 如果传入路径则不会通过时间戳生成uri
 */
export function searchByTimestamp (timestamp: number, path?: Uri): Promise<[boolean, AlarmClockRecordItem]> {
    return new Promise((resolve, reject) => {
        let filePath: Uri;
        if (!path) {
            filePath = joinPathUri(ExtensionUri.get, ...storagePath, `${timestamp}`);
        } else {
            filePath = path;
        }
        isFileExits(filePath).then(state => {
            if (!state) {
                return;
            }
            return readFileUri(filePath);
        }).then(uni8 => {
            const json: AlarmClockRecordItemTask[] = uni8 ? 
                JSON.parse(uni8.toString()) :
                [];
            if (timestamp in clockRecordMap && clockRecordMap[timestamp] !== json.length) {
                clockRecordMap[timestamp] = json.length;
            }
            resolve([uni8?true:false, {
                timestamp,
                task: json
            }]);
        }).catch(err => {
            reject($rej(err, searchByTimestamp.name));
        });
    });
}

/**
 * 将新增的任务写入文件
 */
export function addByTimestamp (timestamp: number, info: string, cycle: AlarmClockRecordItemTask["cycle"] = void 0): Promise<void> {
    return new Promise((resolve, reject) => {
        const filePath = joinPathUri(ExtensionUri.get, ...storagePath, `${timestamp}`);
        searchByTimestamp(timestamp, filePath).then(async ([_, data]) => {
            await insert(timestamp, true);
            data.task.push(Object.assign({
                info
            }, cycle ? { cycle } : {}));
            return writeFileUri(filePath, createBuffer(JSON.stringify(data.task)));
        }).then(() => {
            resolve();
        }).catch(err => {
            reject($rej(err, addByTimestamp.name));
        });
    });
}

/**
 * 删除一条数据
 */
export function deleteByTimestamp (timestamp: number): Promise<void> {
    return new Promise((resolve, reject) => {
        const filePath = joinPathUri(ExtensionUri.get, ...storagePath, `${timestamp}`);
        isFileExits(filePath).then(state => {
            if (state) {
                return uriDelete(filePath);
            }
        }).then(async () => {
            await remove(timestamp, true);
            resolve();
        }).catch(err => {
            reject($rej(err, deleteByTimestamp.name));
        });
    });
}

/**
 * 删除某个时间戳对象中的一个任务
 */
export function deleteTaskInTimestamp (timestamp: number, index: number): Promise<void> {
    return new Promise((resolve, reject) => {
        const filePath = joinPathUri(ExtensionUri.get, ...storagePath, `${timestamp}`);
        searchByTimestamp(timestamp, filePath).then(([exits, data]) => {
            if (!exits) {
                return;
            }
            const length = data.task.length;
            if (index < 0 || index > length - 1) {
                return;
            }
            data.task.splice(index, 1);
            clockRecordMap[timestamp]--;
            if (data.task.length > 0) {
                // 仍有数据则更新文件
                return writeFileUri(filePath, createBuffer(JSON.stringify(data.task)));
            } else {
                return deleteByTimestamp(timestamp);
            }
        }).then(resolve).catch(err => {
            reject($rej(err, deleteTaskInTimestamp.name));
        });
    });
}

/**
 * 检索数据处理，初始化时调用
 */
function basicDataHandle (content: string) {
    // 相关数据清除
    clockRecord.splice(0, clockRecord.length);
    for (const key in clockRecordMap) {
        delete clockRecordMap[key];
    }
    const result = content.matchAll(mathcAllTimeRegexp);
    for (const time of result) {
        const timestamp = +time[1], number = +time[2];
        // 二分法插入时间戳
        insert(timestamp, false, number);
    }
}

/**
 * 使用二分查找将指定时间戳插入数组对应位置
 */
function insert (timestamp: number, refresh: true): Promise<void>; 
function insert (timestamp: number, refresh?: false, addNumber?: number): void; 
function insert (timestamp: number, refresh: boolean = false, addNumber: number = 1) {
    if (!isNumber(addNumber) || addNumber === 0) {
        addNumber = 1;
    }
    if (!clockRecord.includes(timestamp)) {
        clockRecord.splice(bisectionAsce(clockRecord, timestamp), 0, timestamp);
        clockRecordMap[timestamp] = addNumber;
    } else {
        clockRecordMap[timestamp] += addNumber;
    }
    if (refresh) {
        return refreshBasicData();
    }
}

/**
 * 移除一条时间戳数据
 */
function remove (timestamp: number, refresh: true): Promise<void>; 
function remove (timestamp: number, refresh?: false): void; 
function remove (timestamp: number, refresh: boolean = false) {
    if (clockRecord.includes(timestamp)) {
        clockRecord.splice(clockRecord.indexOf(timestamp), 1);
    }
    // 当删除时间戳时，一般性情况是整个时间戳的任务触发，所以对应的任务数量清零
    // 只删除时间戳内的某一条任务的处理方法单独封装
    if (timestamp in clockRecordMap) {
        delete clockRecordMap[timestamp];
    }
    if (refresh) {
        return refreshBasicData();
    }
}

/**
 * 更新记录文件
 */
function refreshBasicData () {
    const result = clockRecord.reduce((prev, curr) => {
        prev += calcNumber`${curr};`;
        return prev;
    }, '');
    return writeFileUri(joinPathUri(ExtensionUri.get, ...storagePath, basicFile), createBuffer(result));
}

/**
 * 拼接最后的字符串结果
 */
function calcNumber (str: TemplateStringsArray, timestamp: number) {
    const num = clockRecordMap[timestamp];
    const sufix = isNumber(num) && num > 1 ? `{${num}}` : '';
    return timestamp + sufix + str.join('');
}