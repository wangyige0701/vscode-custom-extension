/** @description 背景图模块公用的交互函数，部分交互方法另存于单独层级下 */

import { $rej, errlog } from "@/error";
import { windowReload } from "@/common/system";
import { showMessage, setStatusBar, showMessageModal, selectFolderOnly } from "@/common/interactive";
import { resetImageStoreFolder } from "@background/image/folder/setter";

/**
 * 打开系统默认样式的弹框，有一个确认按钮，取消通过reject抛出，默认内容为是否设置背景图
 * @param message 弹框文本
 */
export function showMessageByModal (message: string = '是否设置此背景图'): Promise<void> {
    return new Promise((resolve, reject) => {
        showMessageModal(message)
        .then(res => {
            if (res) {
                return resolve();
            }
            // 选择取消返回reject
            reject();
        })
        .catch((err) => {
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
    })
    .then(res => {
        if (res && res.id === 0) {
            windowReload();
        }
    })
    .catch(err => {
        return Promise.reject(err);
    });
}

/** 选择文件夹作为背景图数据储存路径 */
export function selectFolderForBackgroundStore (): void {
    showMessageModal('是否修改背景图储存路径')
    .then(res => {
        if (res) {
            return selectFolderOnly('选择背景图储存文件夹');
        }
    })
    .then(data => {
        if (data) {
            return resetImageStoreFolder(data.dirName);
        }
    })
    .catch(err => {
        errlog(err, true);
    });
}

/** 重置背景图储存路径 */
export function resetBackgroundStorePath (): void {
    showMessageModal('是否重置背景图储存路径')
    .then(res => {
        if (res) {
            return resetImageStoreFolder('', true);
        }
    })
    .catch(err => {
        errlog(err, true);
    });
}
