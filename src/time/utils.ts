import { getDate, isArray, isNumber } from "../utils";
import type { Cycle, SpecificWeek } from "./types";

/** 星期 */
export const weeksName = ['日', '一', '二', '三', '四', '五', '六'];

/**
 * 对时间戳进行精确处理，忽略秒数，只返回到分钟的时间戳
 */
export function accurateTime (timestamp: number): number {
    return new Date(getDate(timestamp, "YYYY-MM-DD hh:mm:00")).getTime();
}

/**
 * 根据周期计算下一次触发的新时间戳
 * 星期列表是0-6的数字组成的数组，0代表周日
 */
export function cycleCalculate (timestamp: number, cycle: Cycle): number;
export function cycleCalculate (timestamp: number, cycle?: Cycle | undefined) {
    if (cycle === "DAY") {
        return timestamp + 1000 * 60 * 60 * 24;
    } else if (cycle === "WEEK") {
        return timestamp + 1000 * 60 * 60 * 24 * 7;
    } else if (isArray(cycle)) {
        const w = (new Date(timestamp).getDay()) as SpecificWeek;
        if (!cycle.includes(w)) {
            // 传入的时间戳并非处于周期中的时间，则需要查找距离此时间戳最近的星期
            if (w < cycle[0]) {
                return timestamp + (1000 * 60 * 60 * 24 * (cycle[0] - w));
            } else if (w > cycle[cycle.length - 1]) {
                return timestamp + (1000 * 60 * 60 * 24 * (6 - w + cycle[0]));
            } else {
                for (const week of cycle) {
                    if (w < week) {
                        return timestamp + (1000 * 60 * 60 * 24 * (week - w));
                    }
                }
            }
        }
        let curr = cycle.indexOf(w), next = curr + 1;
        if (next >= cycle.length ) {
            next = 0;
        }
        if (next === curr) {
            // 日期相同，时间加七天
            return timestamp + 1000 * 60 * 60 * 24 * 7;
        }
        // 时间换算
        next = cycle[next], curr = cycle[curr];
        next = next === 0 ? 7 : next, curr = curr === 0 ? 7 : 0;
        if (next < curr) {
            // 例如：当前周六，下一天周一
            return timestamp + 1000 * 60 * 60 * 24 * (7 - curr + next);
        }
        // 例如：当前周二，下一天周六
        return timestamp + 1000 * 60 * 60 * 24 * (next - curr);
    }
}

/** 获取当前时间，返回12小时制的字符串，可以选择是否包含时钟图标代码 */
export function getTimeString (timestamp: number, icon: boolean = true) {
    let date = new Date(timestamp),
    y = date.getFullYear(),
    M = date.getMonth() + 1,
    d = date.getDate(),
    h = date.getHours(),
    m = date.getMinutes(),
    meridiem = 'AM';
    if (h > 11 && h < 23) {
        meridiem = 'PM';
    }
    if (h > 12) {
        h = h - 12;
    }
    return `${icon ? '$(wangyige-clock) ' : ''}` + `${y}/${_a(M)}/${_a(d)} ${_a(h)}:${_a(m)} ${meridiem}【周${weeksName[date.getDay()]}】`;
}

/** 补位 */
function _a (value: number): string {
    return `${value}`.padStart(2, '0');
}

/**
 * 将12小时制时间转为24小时制，只能修改时分格式，结尾必须有a或p
 */
export function changeHourTo24 (time: string, symbol: string = ":") {
    time = time.trim();
    const check = time.match(new RegExp(`^(\\d*)\\s*\\${symbol}\\s*(\\d*).*$`));
    if (!check) {
        throw new Error("时间格式错误");
    }
    let [hour, minute]: Array<number> = check.splice(1, 2).map(item => +item);
    function _handle (hour: number, minute: number, is24: boolean) {
        if (minute < 0 || minute > 59) {
            throw new Error(`分钟：${minute}超出范围`);
        }
        if (is24 && (hour < 1 || hour > 24)) {
            throw new Error(`24小时制，小时：${hour}超出范围`);
        } else if (!is24 && (hour < 1 || hour > 12)) {
            throw new Error(`12小时制，小时：${hour}超出范围`);
        }
    }
    // 判断12小时制还是24小时制
    let period = (time.endsWith('p') || time.endsWith('P')) ? 'pm' : (time.endsWith('a') || time.endsWith('A')) ? 'am': false;
    _handle(hour, minute, period === false ? true : false);
    if (period !== false) {
        if (period === 'pm') {
            hour = hour === 12 ? 12 : hour + 12;
        } else {
            hour === 12 && (hour = 24);
        }
    }
    return `${_a(hour)}${symbol}${_a(minute)}`;
}

/**
 * 判断是不是闰年
 */
export function leapYear (year: number) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** 判断日期是否存在 */
export function isDateExist (year: string | number, month: string | number, day: string | number) {
    const isLeapYear = leapYear(+year);
    const monthNum = +month;
    const dayNum = +day;
    if (monthNum === 2) {
        return isLeapYear ? dayNum <= 29 : dayNum <= 28;
    } else if (monthNum === 4 || monthNum === 6 || monthNum === 9 || monthNum === 11) {
        return dayNum <= 30;
    } else {
        return dayNum <= 31;
    }
}

/**
 * 返回周期的信息
 */
export function cycleInfo (cycle?: Cycle) {
    if (cycle === 'DAY') {
        return "每天响铃";
    } else if (cycle === 'WEEK') {
        return "每周响铃";
    } else if (isArray(cycle) && cycle.every(item => isNumber(item) && item >=0 && item <= 6)) {
        let weeks = cycle.map(item => item === 0 ? 7 : item);
        const result = weeks.reduce((prev, curr) => {
            prev.push('周' + weeksName[curr]);
            return prev;
        }, [] as string[]);
        return result.join('，') + '响铃';
    }
    return "响铃一次";
}