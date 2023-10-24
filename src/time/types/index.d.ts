
/** 日期数字，0代表周日 */
export type SpecificWeek = 1|2|3|4|5|6|0;

/** 周期数据的类型 */
export type Cycle = 'DAY'|'WEEK'|SpecificWeek[];

/**
 * 闹钟任务数组的元素
 */
interface AlarmClockRecordItemTask {
    /** 周期，可以设置为每天或者每周的同一时间，也可以设置为具体周几的时间 */
    cycle?: Cycle;
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

export type CreateAlarmClockCallback = (timestamp: number, info: string, cycle: AlarmClockRecordItemTask["cycle"]) => any;