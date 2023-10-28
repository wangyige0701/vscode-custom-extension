import { CycleItem } from "../cycle";


/** 日期数字，0代表周日 */
export type SpecificWeek = 1 | 2 | 3 | 4 | 5 | 6 | 0;

/** 周期数据的类型 */
export type Cycle = CycleItem.DAY | CycleItem.WEEK | SpecificWeek[];

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

export type CreateAlarmClockCallback = (timestamp: number, info: string, cycle: AlarmClockRecordItemTask["cycle"]) => Promise<void>;

export type SettingOptionsType<T> = {
    timestamp: number;
    taskInfo: string;
    cycle: T;
};

export type SettingOptionsExcludeType<T> = Omit<SettingOptionsType<T>, "taskInfo">;

export type SettingOptionsAllTypes = void|CycleItem|SpecificWeek[];

export type SettingOptionsCallbackParams = { 
    defaultNext: boolean;
    stepSetting?: CreateTimeInputSteps;
};

export type SettingOptionsIsPromise<T> = () => Promise<T>;

type Type1 = SettingOptionsType<SettingOptionsAllTypes>;
type Type2 = SettingOptionsExcludeType<SettingOptionsAllTypes>;

export type SettingOptionsCallbackType = (
    options: SettingOptionsCallbackParams,
    timestamp: number, 
    nowTimestamp: number, 
    inputTime?: string
) => Promise<false|SettingOptionsIsPromise<Type1>|SettingOptionsIsPromise<Type2>>;

export type CreateTimeInputSteps = {
    step: number;
    totalSteps: number;
};