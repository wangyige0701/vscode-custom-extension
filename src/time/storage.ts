import type { Uri } from "vscode";
import { createBuffer, createDirectoryUri, isFileExits, isFileExitsSync, joinPathUri, readFileUri, uriDelete, writeFileUri } from "../utils/file";
import ExtensionUri from "../utils/system/extension";
import { $rej } from "../error";
import type { AlarmClockRecordItem, AlarmClockRecordItemTask, Cycle, UpdateTimestampTarget } from "./types";
import { isNumber } from "../utils";
import { ClockRecord } from "./cache";

/** 闹钟时间数据记录数组，元素为时间戳，升序排列 */
export const clockRecord: ClockRecord = new ClockRecord(refreshBasicData);

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
    function _check (pathUri: Uri) {
        clockRecord.forEach((time) => {
            if (!isFileExitsSync(joinPathUri(pathUri, time.toString()))) {
                clockRecord.stopRefresh().remove(time);
            }
        });
    }
    /** 检索数据处理，初始化时调用 */
    function _basicDataHandle (content: string) {
        const result = content.matchAll(mathcAllTimeRegexp);
        for (const time of result) {
            clockRecord.stopRefresh().addTask(+time[1], +time[2]);
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
            _basicDataHandle(res);
            _check(fileUri);
            await clockRecord.toRefresh();
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
        filePath = path ? path : joinPathUri(ExtensionUri.get, ...storagePath, `${timestamp}`);
        isFileExits(filePath).then(state => {
            if (!state) {
                return;
            }
            return readFileUri(filePath);
        }).then(async uni8 => {
            const json: AlarmClockRecordItemTask[] = uni8 ? 
                JSON.parse(uni8.toString()) :
                [];
            if (clockRecord.has(timestamp)) {
                // 任务数量校验
                if (json.length === 0) {
                    await clockRecord.remove(timestamp);
                } else if (clockRecord.taskNumber(timestamp) !== json.length) {
                    await clockRecord.resetTask(timestamp, json.length);
                }
            }
            resolve([uni8 ? true : false, {
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
            data.task.push(Object.assign({
                info
            }, cycle ? { cycle } : {}));
            return writeFileUri(filePath, createBuffer(JSON.stringify(data.task)));
        }).then(async () => {
            await clockRecord.addTask(timestamp);
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
        isFileExits(filePath).then(async state => {
            if (state) {
                await uriDelete(filePath);
                return clockRecord.remove(timestamp);
            }
        }).then(resolve).catch(err => {
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
        searchByTimestamp(timestamp, filePath).then(async ([exits, data]) => {
            if (!exits) {
                return;
            }
            const length = data.task.length;
            if (index < 0 || index > length - 1) {
                return;
            }
            data.task.splice(index, 1);
            if (data.task.length > 0) {
                // 仍有数据则更新文件
                await writeFileUri(filePath, createBuffer(JSON.stringify(data.task)));
            } else {
                await deleteByTimestamp(timestamp);
            }
            await clockRecord.removeTask(timestamp);
        }).then(resolve).catch(err => {
            reject($rej(err, deleteTaskInTimestamp.name));
        });
    });
}

/**
 * 更新指定时间戳中的指定任务的指定数据
 */
export function updateSthInTimstamp (timestamp: number, index: number, { content, type, nextTime }: UpdateTimestampTarget): Promise<void> {
    return new Promise((resolve, reject) => {
        const filePath = joinPathUri(ExtensionUri.get, ...storagePath, `${timestamp}`);
        searchByTimestamp(timestamp, filePath).then(async ([exits, data]) => {
            if (!exits) {
                return;
            }
            const length = data.task.length;
            if (index < 0 || index > length - 1) {
                return;
            }
            const target = data.task[index];
            if (type === 'TIME') {
                await deleteTaskInTimestamp(timestamp, index);
                clockRecord.stopRefresh().removeTask(timestamp);
                if (content > Date.now()) {
                    await addByTimestamp(content, target.info, target.cycle);
                    clockRecord.stopRefresh().addTask(content);
                }
            } else if (type === 'TASK') {
                target.info = content;
                await writeFileUri(filePath, createBuffer(JSON.stringify(data.task)));
            } else if (type === 'CYCLE') {
                target.cycle = content;
                await deleteTaskInTimestamp(timestamp, index);
                clockRecord.stopRefresh().removeTask(timestamp);
                if (nextTime > Date.now()) {
                    await addByTimestamp(nextTime, target.info, target.cycle);
                    clockRecord.stopRefresh().addTask(nextTime);
                }
            }
            await clockRecord.toRefresh();
        }).then(resolve).catch(err => {
            reject($rej(err, updateSthInTimstamp.name));
        });
    });
}

/**
 * 更新记录文件
 */
function refreshBasicData () {
    const result = clockRecord.origin.reduce((prev, curr) => {
        prev += calcNumber`${curr};`;
        return prev;
    }, '');
    return writeFileUri(joinPathUri(ExtensionUri.get, ...storagePath, basicFile), createBuffer(result));
}

/**
 * 拼接最后的字符串结果
 */
function calcNumber (str: TemplateStringsArray, timestamp: number) {
    const num = clockRecord.taskNumber(timestamp);
    if (isNumber(num) && num > 0) {
        return `${timestamp}{${num}}${str.join('')}`;
    }
    return "";
}