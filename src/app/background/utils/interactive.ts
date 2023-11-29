/** @description 背景图模块公用的交互函数，部分交互方法另存于单独层级下 */

import { showMessage, setStatusBar, showMessageModal } from "../../../common/interactive";
import { windowReload } from "../../../common/system";
import { $rej } from "../../../error";

/**
 * 打开系统默认样式的弹框，有一个确认按钮，取消通过reject抛出，默认内容为是否设置背景图
 * @param message 弹框文本
 */
export function showMessageByModal (message: string = '是否设置此背景图'): Promise<void> {
    return new Promise((resolve, reject) => {
        showMessageModal(message)
        .then(res => {
            if (res) {
                // 返回true
                return resolve();
            }
            // 选择取消返回reject
            reject();
        }).catch((err) => {
            reject($rej(err, showMessageByModal.name));
        });
    });
}

/**
 * 允许传入回调函数的状态栏信息展示方法
 * @param message 
 * @param icon 
 * @param time 
 * @param callback 
 */
export function setBackgroundInfoOnStatusBar (message: string = '', icon: string = 'check', time: number = 3000, callback: () => any) {
    setStatusBar({
        icon,
        message
    }, time);
    setTimeout(callback, time);
}

/**
 * 背景图设置成功，状态栏提示
 * @param message
 * @param time 状态栏内容消失的时间
 */
export function setBackgroundImageSuccess (message: string = '背景图设置成功', time: number = 3000) {
    setStatusBar({
        icon: 'check',
        message
    }, time);
}

/**
 * 是否重启窗口更新背景
 * @param title 标题
 */
export function isWindowReloadToLoadBackimage (title: string = '是否重启窗口以应用背景') {
    showMessage({
        message: title,
        modal: false,
        items: [{
            id: 0,
            title: '确认'
        }, {
            id: 1,
            title: '取消'
        }]
    }).then(res => {
        if (res && res.id === 0) {
            windowReload();
        }
    }).catch(err => {
        return Promise.reject(err);
    });
}