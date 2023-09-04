import type { CheckSumsData } from "./types/index";

/** 校验和数据记录 */
const mapData: Map<string, CheckSumsData> = new Map();

export const checksumsMap = {
    /** 插入一条数据 */
    set (path: string, data: CheckSumsData) {
        mapData.set(path, data);
    },

    /** 获取数据 */
    get (path: string): undefined | CheckSumsData {
        return mapData.get(path);
    },

    /** 移除数据 */
    delete (path: string) {
        mapData.delete(path);
    },

    clear () {
        mapData.clear();
    },

    origin () {
        return mapData;
    }
}

/** 文件校验和数组 */
const arrayData: string[] = [];

export const checksumsArray = {
    push (value: string) {
        arrayData.push(value);
    },

    shift () {
        return arrayData.shift();
    },

    unshift (value: string) {
        arrayData.unshift(value);
    },

    pop () {
        return arrayData.pop();
    },

    length () {
        return arrayData.length;
    },

    index (target: string) {
        return arrayData.indexOf(target);
    },

    splice (start: number, deleteCount?: number) {
        return arrayData.splice(start, deleteCount);
    },

    origin () {
        return arrayData;
    }
}