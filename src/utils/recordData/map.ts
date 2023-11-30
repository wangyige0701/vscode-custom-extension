import type { RecordDataByMapType } from "./types";

/** 通过map记录数据 */
export class RecordDataByMap<T> implements RecordDataByMapType<T> {
    private mapData: Map<string, T> = new Map();

    public set (key: string, data: T): void {
        this.mapData.set(key, data);
    }

    public get (key: string): undefined | T {
        return this.mapData.get(key);
    }

    public delete (key: string): void {
        this.mapData.delete(key);
    }

    public has (key: string): boolean {
        return this.mapData.has(key);
    }

    public clear(): void {
         this.mapData.clear();
    }

    /** 获取map数据 */
    get origin () {
        return this.mapData;
    }
}