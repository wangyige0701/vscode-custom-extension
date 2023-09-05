import type { CheckSumsData, ChecksumsDataOperation } from "./types/index";


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

    /** 更新校验和哈希值 */
    update (name: string, hash: string) {
        if (this.has(name)) {
            const value = this.get(name)!;
            value.value = hash;
            this.set(name, value);
        }
    }

    get origin () {
        return this.mapData;
    }
}