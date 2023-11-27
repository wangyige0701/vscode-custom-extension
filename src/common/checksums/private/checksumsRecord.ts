/**
 * 校验和数据记录
 */
import type { CheckSumsData, CheckSumsDataRecordType } from "../types";
import { RecordDataByMap } from "../../../utils";

class CheckSumsDataRecord extends RecordDataByMap<CheckSumsData> {
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
}

/** 记录校验和数据 */
export const checksumsMap: CheckSumsDataRecordType<CheckSumsData> = new CheckSumsDataRecord();