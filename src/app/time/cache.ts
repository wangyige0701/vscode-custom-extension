import { isFunction, range, bisectionAsce } from "../../utils";

/**
 * 闹钟数据储存类；
 * 使用`add`可以开辟新的时间戳储存实例，而对应的任务数量必须通过`addTask`方法添加
 */
export class ClockRecord {
    /** 注册的回调函数 */
    private onChange: () => Promise<void>;

    /** 元素属性修改后调用的回调列表 */
    private onChangeList: Function[] = [];

    /** 数据修改后是否需要调用刷新函数 */
    private needRefresh: boolean = true;

    /** 轮询执行所有函数 */
    private pollingChangeCallback () {
        const copy = this.origin;
        this.onChangeList.forEach(callback => callback.call(this));
    }

    /** 存放时间戳的数组 */
    private array: number[] = [];

    /** 存放时间戳对应任务数量的哈希表 */
    private map: Map<string, number> = new Map();

    /** 刷新函数 */
    toRefresh: () => Promise<void>;

    constructor (changeCallback: () => Promise<void>) {
        this.clear();
        this.onChange = changeCallback;
        this.toRefresh = async () => {
            if (this.needRefresh) {
                await this.onChange();
            } else {
                this.needRefresh = true;
            }
        };
    }

    /** 注册一个在数据修改时触发的函数 */
    registChange (changeCallback: Function, immediately: boolean = false) {
        if (isFunction(changeCallback)) {
            this.onChangeList.push(changeCallback);
            if (immediately) {
                changeCallback.call(this);
            }
        }
    }

    /** 下一次修改数据后不会进行更新 */
    stopRefresh () {
        this.needRefresh = false;
        return this;
    }

    /** 清除数据 */
    clear () {
        this.array.splice(0, this.array.length);
        this.map.clear();
    }

    /** 是否存在指定时间戳的数据 */
    has (timestamp: number) {
        return this.array.includes(timestamp);
    }

    /** 插入一个时间戳，自动排序，此方法不会进行文件写入 */
    add (timestamp: number) {
        if (!this.has(timestamp)) {
            this.array.splice(bisectionAsce(this.origin, timestamp), 0, timestamp);
            this.map.set(timestamp.toString(), 0);
        }
    }

    /** 插入一个时间戳的任务，对应任务数量加一 */
    async addTask (timestamp: number, taskNumber: number = 1) {
        if (!this.has(timestamp)) {
            this.add(timestamp);
        }
        this.map.set(timestamp.toString(), this.taskNumber(timestamp) + taskNumber);
        await this.toRefresh();
        this.pollingChangeCallback();
    }

    /** 重置任务数量 */
    async resetTask (timestamp: number, taskNumber: number) {
        if (!this.has(timestamp)) {
            this.add(timestamp);
        }
        this.map.set(timestamp.toString(), taskNumber);
        await this.toRefresh();
        this.pollingChangeCallback();
    }

    /** 移除一条时间戳对应的数据 */
    async remove (timestamp: number) {
        if (this.has(timestamp)) {
            this.array.splice(this.array.indexOf(timestamp), 1);
            this.map.delete(timestamp.toString());
            await this.toRefresh();
            this.pollingChangeCallback();
        }
    }

    /** 移除某一条时间戳对应的数据中的指定任务数量 */
    async removeTask (timestamp: number, taskNumber: number = 1) {
        if (this.has(timestamp)) {
            const _taskNumber = this.taskNumber(timestamp);
            if (_taskNumber >= taskNumber) {
                this.map.set(timestamp.toString(), _taskNumber - taskNumber);
            } else {
                // 已有任务数量小于减去的任务数量，则移除当前记录中的此时间戳数据
                this.remove(timestamp);
            }
            await this.toRefresh();
            this.pollingChangeCallback();
        }
    }

    /** 获取指定时间戳对应的任务数量 */
    getTaskNumber (timestamp: number) {
        return this.map.get(timestamp.toString()) || 0;
    }

    /** 数据长度 */
    get length () {
        return this.array.length;
    }

    /** 根据时间戳获取对应时间的任务数量 */
    taskNumber (timestamp: number) {
        return this.map.get(timestamp.toString()) || 0;
    }

    /** 拷贝后的源数据 */
    get origin () {
        return [...this.array];
    }

    /** 通过索引查询 */
    findByIndex (index: number) {
        return this.array[index];
    }

    forEach (callback: (item: number, index: number, state: (model: 'BREAK') => void) => void) {
        let toBreak: boolean = false;
        $Door: for (const $i of range(this.length)) {
            callback.call(this, this.array[$i], $i, (model) => {
                if (model === 'BREAK') {
                    toBreak = true;
                }
            });
            if (toBreak) {
                break $Door;
            }
        }
    }
}