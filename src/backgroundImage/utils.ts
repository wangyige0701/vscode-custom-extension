import { joinPathUri } from "../utils/file";
import { setMessage, setStatusBar } from "../utils/interactive";
import { windowReload } from "../utils/system";
import { contextContainer } from "../utils/webview";
import { Uri } from "vscode";
import { backgroundImageConfiguration } from "../workspace/background";
import { errHandle } from "../error";

/**
 * 获取储存背景图资源的uri
 * @returns {Uri|undefined}
 */
export function imageStoreUri (): Uri | undefined {
    const uri = contextContainer.instance?.extensionUri;
    if (uri) {
        return joinPathUri(uri, 'resources', 'background');
    } else {
        return;
    }
}

/**
 * 是否设置背景图弹框
 * @returns 
 */
export function isChangeBackgroundImage (message: string = '是否设置此背景图'): Promise<void> {
    return new Promise((resolve, reject) => {
        try {
            setMessage({
                message: '提示',
                modal: true,
                detail: message,
                items: [{
                    id: 0,
                    title: '确认'
                }]
            }).then(res => {
                if (res && res.id === 0) {
                    // 返回true
                    resolve();
                    return;
                }
                // 选择取消返回reject
                reject();
            }).catch((err) => {
                reject(err);
            });
        } catch (error) {
            errHandle(error);
        }
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
 */
export function setBackgroundImageSuccess (message: string = '背景图设置成功', time: number = 3000) {
    setStatusBar({
        icon: 'check',
        message
    }, time);
}

/**
 * 是否重启窗口更新背景
 */
export function isWindowReloadToLoadBackimage (title: string = '是否重启窗口以应用背景') {
     try {
        setMessage({
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
        });
    } catch (error) {
        errHandle(error);
    }
}

/**
 * 更改缓存中的加载状态属性
 */
export function changeLoadState () {
    backgroundImageConfiguration.setBackgroundLoad(true);
}