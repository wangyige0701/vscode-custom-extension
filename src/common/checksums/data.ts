import type { CheckSumsData, ChecksumsDataOperation } from "./types";

export const checksumsMap: ChecksumsDataOperation<Map<string, CheckSumsData>> = new class {
    /** 校验和数据记录 */
    private mapData: Map<string, CheckSumsData> = new Map();

    /** 插入一条数据 */
    set (name: string, data: CheckSumsData) {
        this.mapData.set(name, data);
    }

    /** 获取数据 */
    get (name: string): undefined | CheckSumsData {
        return this.mapData.get(name);
    }

    /** 移除数据 */
    delete (name: string) {
        this.mapData.delete(name);
    }

    /** map中是否含有指定数据 */
    has (name: string) {
        return this.mapData.has(name);
    }

    /** 清空map */
    clear () {
        this.mapData.clear();
    }

    /** 新旧哈希是否相同 */
    same (name: string, hash: string) {
        if (this.has(name)) {
            return this.get(name)!.value === hash;
        }
        return false;
    }

    /** 更新校验和哈希值 */
    update (name: string, hash: string) {
        if (this.has(name)) {
            this.get(name)!.value = hash;
        }
    }

    get origin () {
        return this.mapData;
    }
};

/** 校验和数据的状态 */
export class ChecksumsState {
    /** 是否允许修改校验和 */
    static canChangeChecksums = false;

    /** 是否初始化 */
    static init = false;

    /** 更改能否修改校验和状态 */
    static change (state: boolean  = true) {
        this.canChangeChecksums = state;
        return this;
    }

    /** 获取是否允许修改校验和状态 */
    static get canChange () {
        return this.canChangeChecksums;
    }

    /** 修改初始化状态 */
    static initial () {
        this.init = true;
    }

    /** 是否已经初始化 */
    static get isInitial () {
        return this.init;
    }
}