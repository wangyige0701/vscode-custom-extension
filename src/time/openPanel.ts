import { getInputInfo, createAndShowQuickPick, showQuickPick } from "../utils/interactive";

/** 校验时间格式，时：可以写单数字，也可以在前面添零补位；分：个位数字必须补位；连接符：[/-:] */
const timeCheck = /^([1-9]|0[1-9]|1[0-9]|2[0-4])[\/\-\:](0[0-9]|[1-5][0-9])/;

/**
 * 打开设置闹钟的操作面板
 */
export function openOperationPanel () {
    createAndShowQuickPick([{
        callback: _create,
        options: {
            label: '新建闹钟',
        }
    }]);

    /**
     * 创建新闹钟
     */
    function _create () {
        getInputInfo({
            title: "请输入时间",
            prompt: "格式为：时:分；如：9:05  ",
            placeHolder: "分钟个位必须补零；必须是24小时制；连接符可以是 /-:",
            regexp: timeCheck,
            error: "时间格式错误"
        }).then(res => {
            if (!res) {
                return;
            }
            _options(res);
        });
    }

    /** 触发函数映射 */
    const callMap = [_today, _everyDay, _everyWeek, _everyWeek, _specifyWeek, _specifyDay];

    /** 选项列表 */
    const infoList = ['当天提醒', '每天提醒', '每周提醒', '指定星期提醒', '指定年月日提醒'].map((item, index) => {
        return {
            label: item,
            callback: callMap[index],
            index
        };
    });
    
    /**
     * 打开操作选项
     */
    function _options (time: string) {
        showQuickPick(infoList, {
            title: '请选择设置方式',
            placeHolder: `当前预设置时间：${time}`,
            ignoreFocusOut: true,
            onDidSelectItem: _optionsChange
        }).then(res => {
            if (!res) {
                return;
            }
            res.callback?.(time);
        });
    }

    /**
     * 切换选项时显示提示
     */
    function _optionsChange () {}

    /**
     * 当天，需要判断时间是否超过
     */
    function _today (time: string) {}

    function _everyDay (time: string) {}

    function _everyWeek (time: string) {}

    function _specifyWeek (time: string) {}

    function _specifyDay (time: string) {}
}
