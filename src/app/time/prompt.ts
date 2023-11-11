import { setStatusBarResolve, showMessage } from "../../utils/interactive";


/**
 * 显示闹钟信息
 */
export function showAlarmClockInfo (time: string, info: string) {
    const dispose = setStatusBarResolve(`$(wangyige-alarmClock)【${time}】闹钟已响铃`);
    setTimeout(() => {
        dispose?.dispose();
    }, 10000);
    showMessage({
        type: 'information',
        message: `【${time}】> ${info}`,
        items: [{
            title: "确认"
        }]
    }).then(() => {
        dispose?.dispose();
    });
}