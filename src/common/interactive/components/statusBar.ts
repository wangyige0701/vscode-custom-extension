import type { Disposable, StatusBarItem } from "vscode";
import type { StatusBarCallback, StatusBarIconMessage, StatusBarItemOptions, StatusBarParam } from "../types";
import { StatusBarAlignment, window } from "vscode";
import { isNumber, isObject, isUndefined } from "../../../utils";

/**
 * 设置底部状态栏文字内容
 * @param message 
 * @param option 
 * @param callback 
 * @param callbackParam 
 */
export function setStatusBar (message: string | StatusBarIconMessage, option?:StatusBarParam, callback?: StatusBarCallback, ...callbackParam: any[]): Disposable {
    if (isObject(message)) {
        message = `$(${message.icon})${message.message}`;
    }
    if (isUndefined(option)) {
        return window.setStatusBarMessage(message);
    }
    let thenable: Thenable<any>;
    if (isNumber(option)) {
        thenable = <Promise<void>>new Promise((resolve, reject) => {
            Promise.resolve().then(() => {
                setTimeout(() => {
                    callback?.(...callbackParam);
                    resolve();
                }, option);
            }).catch(err => {
                reject(new Error('Catch Error', { cause: err }));
            });
        });
    } else {
        thenable = option;
    }
    return window.setStatusBarMessage(message, thenable);
}

/**
 * 通过dispose手动关闭statusBar的方法
 * @param message 
 */
export function setStatusBarResolve (message: string | StatusBarIconMessage): Disposable {
    if (isObject(message)) {
        message = `$(${message.icon})${message.message}`;
    }
    return window.setStatusBarMessage(message);
}

/**
 * 创建一个底部状态栏元素，传入command可以点击触发命令
 */
export function setStatusBarItem ({ alignment = 'Right', priority, command }: StatusBarItemOptions): StatusBarItem {
    const item = window.createStatusBarItem(StatusBarAlignment[alignment], priority);
    if (command) {
        item.command = command;
    }
    return item;
}