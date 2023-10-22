import type { Uri } from "vscode";
import { createBuffer, createDirectoryUri, isFileExits, joinPathUri, readFileUri, writeFileUri } from "../utils/file";
import { bisectionAsce } from "../utils/algorithm";
import ExtensionUri from "../utils/system/extension";
import { $rej } from "../error";

/** 闹钟数据记录数组，元素为时间戳 */
export const clockRecord: number[] = [];

/** 储存闹钟数据的文件夹 */
export const storagePath = ["resources", "alarmclock"];

const basicFile = '.basic';
const sectionOfAllDatas = "All";
const sectionOfTime = "Time";
/** 匹配所有时间数据 */
const mathcAllTime = /(\d{13});/g;

/**
 * ini文件初始化，如果不存在则进行创建，存在则获取所有时间戳的数据即key为All的配置项
 * 返回数组
 */
export function fileInit () {
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
        }).catch(err => {
            reject($rej(err, fileInit.name));
        });
    });
}

/**
 * 根据时间戳查询数据
 */
export function searchByTimestamp (timestamp: number) {}

/**
 * 检索数据处理
 */
function basicDataHandle (content: string) {
    clockRecord.splice(0, clockRecord.length);
    for (const time of content.matchAll(mathcAllTime)) {
        const timestamp = +time[1];
        // 二分法插入时间戳
        clockRecord.splice(bisectionAsce(clockRecord, timestamp), 0, timestamp);
    }
}