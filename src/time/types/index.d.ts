
/**
 * 闹钟任务数组的元素
 */
interface AlarmClockRecordItemTask {
    /** 周期，可以设置为第二天或者下一周的同样时间 */
    cycle?: 'DAY'|'WEAK';
    /** 任务描述 */
    info: string;
}

/**
 * 闹钟记录数组的元素
 */
export interface AlarmClockRecordItem {
    /** 时间戳 */
    timestamp: number;
    /** 当前时间戳的任务数组 */
    task: AlarmClockRecordItemTask[];
}