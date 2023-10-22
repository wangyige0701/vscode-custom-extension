import type { Uri } from "vscode";
import { createBuffer, createDirectoryUri, isFileExits, joinPathUri, readFileUri, uriDelete, writeFileUri } from "../utils/file";
import { bisectionAsce } from "../utils/algorithm";
import ExtensionUri from "../utils/system/extension";
import { $rej } from "../error";
import type { AlarmClockRecordItem, AlarmClockRecordItemTask } from "./types";

/** 闹钟数据记录数组，元素为时间戳，升序排列 */
export const clockRecord: number[] = [];

/** 储存闹钟数据的文件夹 */
export const storagePath = ["resources", "alarmclock"];

const basicFile = '.basic';
/** 匹配所有时间数据 */
const mathcAllTime = /(\d{13});/g;

/**
 * ini文件初始化，如果不存在则进行创建，存在则获取所有时间戳的数据
 */
export function fileInit (): Promise<void> {
    return new Promise((resolve, reject) => {
        const fileUri = joinPathUri(ExtensionUri.get, ...storagePath),
        retrievalUri = joinPathUri(fileUri, basicFile);
        isFileExits(fileUri).then(state => {
            if (!state) {
                return createDirectoryUri(fileUri);
            }
        }).then(() => {
            return isFileExits(retrievalUri);
        }).then(async state => {
            if (!state) {
                const fileContent = '';
                await writeFileUri(retrievalUri, createBuffer(fileContent));
                return fileContent;
            }
            const fileContent = await readFileUri(retrievalUri);
            return fileContent.toString();
        }).then(res => {
            basicDataHandle(res);
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
            const json = uni8 ? 
                JSON.parse(uni8.toString()) :
                [];
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
 * 将新增的数据写入文件
 */
export function settintByTimestamp (timestamp: number, info: string, cycle: AlarmClockRecordItemTask["cycle"] = void 0): Promise<void> {
    return new Promise((resolve, reject) => {
        const filePath = joinPathUri(ExtensionUri.get, ...storagePath, `${timestamp}`);
        searchByTimestamp(timestamp, filePath).then(([exist, data]) => {
            if (!exist) {
                // 不存在则插入一个时间戳
                insert(timestamp);
            }
            data.task.push(Object.assign({
                info
            }, cycle ? { cycle } : {}));
            return writeFileUri(filePath, createBuffer(JSON.stringify(data.task)));
        }).then(() => {
            resolve();
        }).catch(err => {
            reject($rej(err, settintByTimestamp.name));
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
        }).then(() => {
            clockRecord.includes(timestamp) && clockRecord.splice(clockRecord.indexOf(timestamp), 1);
            resolve();
        }).catch(err => {
            reject($rej(err, deleteByTimestamp.name));
        });
    });
}

/**
 * 检索数据处理
 */
function basicDataHandle (content: string) {
    clockRecord.splice(0, clockRecord.length);
    for (const time of content.matchAll(mathcAllTime)) {
        const timestamp = +time[1];
        // 二分法插入时间戳
        insert(timestamp);
    }
}

/**
 * 使用二分查找将指定时间戳插入数组对应位置
 */
function insert (timestamp: number) {
    clockRecord.splice(bisectionAsce(clockRecord, timestamp), 0, timestamp);
}