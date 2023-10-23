import { getDate, isArray } from "../utils";
import type { Cycle, SpecificWeek } from "./types";

/**
 * 对时间戳进行精确处理，忽略秒数，只返回到分钟的时间戳
 */
export function accurateTime (timestamp: number): number {
    return new Date(getDate(timestamp, "YYYY-MM-DD hh:mm:00")).getTime();
}

/**
 * 根据周期计算下一次触发的新时间戳
 */
export function cycleCalculate (timestamp: number, cycle: Cycle) {
    if (cycle === "DAY") {
        return timestamp + 1000 * 60 * 60 * 24;
    } else if (cycle === "WEEK") {
        return timestamp + 1000 * 60 * 60 * 24 * 7;
    } else if (isArray(cycle)) {
        const w = (new Date(timestamp).getDay()) as SpecificWeek;
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