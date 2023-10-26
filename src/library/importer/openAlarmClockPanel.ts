import { dynamicImportFunction } from "..";
import type { CreateAlarmClockCallback } from "../../time/types";

type OpenAlarmClockPanel = (createAlarmClock: CreateAlarmClockCallback, clockFullInfoType: string) => void;

/** 打开设置闹钟的操作面板 */
const openAlarmClockPanel = dynamicImportFunction<OpenAlarmClockPanel>("alarmClock", () => require("../../time/openAlarmClockPanel").default);

export default openAlarmClockPanel;