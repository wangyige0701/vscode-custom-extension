import type { RecordDataByArrayType } from "./types";

/** 通过数组记录数据 */
export class RecordDataByArray<T> implements RecordDataByArrayType<T> {
    private arrayData: T[] = [];

    get length () {
        return this.arrayData.length;
    }

    get origin () {
        return this.arrayData;
    }

    push (data: T): number {
        return this.arrayData.push(data);
    }

    unshift (data: T): number {
        return this.arrayData.unshift(data);
    }

    shift (): T | undefined {
        return this.arrayData.shift();
    }

    pop (): T | undefined {
        return this.arrayData.pop();
    }

    includes (data: T): boolean {
        return this.arrayData.includes(data);
    }

    includesAll (...datas: T[]): boolean {
        for (const data of datas) {
            if (!this.includes(data)) {
                return false;
            }
        }
        return true;
    }

    indexOf (data: T): number {
        return this.arrayData.indexOf(data);
    }

    splice (start: number): T[];
    splice (start: number, deleteCount: number): T[];
    splice (start: number, deleteCount: number, ...items: T[]): T[];
    splice (start: number, deleteCount?: number, ...items: T[]): T[] {
        if (deleteCount === undefined) {
            return this.arrayData.splice(start);
        }
        return this.arrayData.splice(start, deleteCount, ...items);
    }

    slice (start: number, end?: number | undefined): T[] {
        return this.arrayData.slice(start, end);
    }

    clear () {
        this.splice(0, this.length);
    }

    setLength (length: number): T[] {
        return this.splice(length);
    }

    get (index: number): T | undefined {
        return this.arrayData[index];
    }

    set(index: number, data: T): void {
        this.arrayData[index] = data;
    }
}