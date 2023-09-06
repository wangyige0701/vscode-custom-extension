import { createDirectoryUri, isFileExits, joinPathUri } from "../utils/file";
import { showMessage, setStatusBar } from "../utils/interactive";
import { windowReload } from "../utils/system";
import { contextContainer } from "../utils/webview/index";
import { Uri } from "vscode";
import { backgroundImageConfiguration, defaultPath } from "../workspace/background";
import { WError, errlog, promiseReject } from "../error";
import { minmax } from "../utils";
import { backgroundSendMessage } from "./execute_webview";

/** 获取储存背景图资源的uri，指定路径不存在则会进行创建 */
export function imageStoreUri (): Promise<Uri | void> {
    return new Promise((resolve, reject) => {
        try {
            let uri: string | Uri | undefined = backgroundImageConfiguration.getBackgroundStorePath();
            if (uri) {
                // 缓存内有路径数据
                uri = Uri.file(uri);
            } else {
                // 没有缓存数据则获取插件路径
                uri = contextContainer.instance?.extensionUri;
                if (uri) {
                    uri = joinPathUri(uri, ...defaultPath);
                } else {
                    uri = void 0;
                }
            }
            if (!uri) {
                resolve();
                return;
            }
            imageStoreUriExits(uri).then(uri => {
                resolve(uri);
            }).catch(err => {
                reject(promiseReject(err, 'imageStoreUri'));
            });
        } catch (error) {
            reject(promiseReject(error, 'imageStoreUri'));
        }
    });
}

/**
 * 校验指定路径是否存在，不存在进行创建
 * @param uri 
 */
export function imageStoreUriExits (uri: Uri): Promise<Uri> {
    return new Promise((resolve, reject) => {
        if (!uri) {
            reject(new WError('Undefined Uri', {
                position: 'Parameter',
                FunctionName: 'imageStoreUriExits',
                ParameterName: 'uri'
            }));
            return;
        }
        isFileExits(uri).then(res => {
            if (!res) {
                // 文件夹不存在进行创建
                return createDirectoryUri(uri);
            }
        }).then(() => {
            resolve(uri);
        }).catch(err => {
            reject(promiseReject(err, 'imageStoreUriExits'));
        });
    });
}

/**
 * 重新设置背景图储存路径数据
 * @param path 
 * @param reset 是否重置路径
 */
export async function resetImageStorePath (path: string, reset: boolean = false): Promise<void> {
    if (reset) {
        if (!backgroundImageConfiguration.getBackgroundStorePath()) {
            showMessage({
                message: '当前储存路径已为默认路径'
            });
            return Promise.resolve();
        }
        await Promise.resolve(
            backgroundImageConfiguration.setBackgroundStorePath("")
        ).catch(err => {
            return Promise.reject(promiseReject(err, 'resetImageStorePath'));
        });
        showMessage({
            message: '背景图储存路径已切换为默认路径'
        });
        sendStoreChangeMessage();
        return Promise.resolve();
    }
    const uri = Uri.file(path);
    if (path && uri) {
        // 缓存数据
        await Promise.resolve(
            backgroundImageConfiguration.setBackgroundStorePath(uri.fsPath)
        ).catch(err => {
            return Promise.reject(promiseReject(err, 'resetImageStorePath'));
        });
        showMessage({
            message: '背景图储存路径已切换为：'+uri.fsPath
        });
        sendStoreChangeMessage();
    }
    return Promise.resolve();
}

/** 背景图储存路径修改通知 */
function sendStoreChangeMessage () {
    backgroundSendMessage({
        name: 'backgroundStorePathChange',
        value: true
    });
}

/**
 * 打开系统弹框，有一个确认按钮，取消通过reject抛出，默认内容为是否设置背景图
 * @param message 弹框文本
 */
export function isChangeBackgroundImage (message: string = '是否设置此背景图'): Promise<void> {
    return new Promise((resolve, reject) => {
        showMessage({
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
            reject(promiseReject(err, 'isChangeBackgroundImage'));
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
        errlog(err);
    });
}

/** 更改缓存中的加载状态属性 */
export function changeLoadState () {
    backgroundImageConfiguration.setBackgroundLoad(true);
}

/**
 * 根据给定透明度计算需要设置的透明度
 * @param opacity 
 */
export function getNewBackgroundOpacity (opacity: number): number {
    opacity = minmax(0.1, 1, opacity);
    opacity = +(0.95 + (-0.45 * opacity)).toFixed(2);
    return opacity;
}

/** 关闭随机切换背景图后的消息提示 */
export function closeRandomBackground () {
    showMessage({ message: '已关闭背景图随机切换。' });
    backgroundSendMessage({
        name: 'backgroundRandomList',
        value: false
    });
}