import { Disposable, MessageItem, ProgressLocation, ProgressOptions, Uri, window } from 'vscode';
import { check, isNumber, isObject, isString, isUndefined } from '../index';
import { dirname } from 'path';
import { MessageBoxType, ProgressLocationData, ProgressOptionsNew, ProgressTaskType, SelectFileParams, StatusBarCallback, StatusBarIconMessage, StatusBarParam } from './main';

/**
 * 调用输入框api获取输入内容
 * @param title 输入框下方提示标题
 * @param placeHolder 占位符
 * @param reg 正则校验规则
 * @returns {Promise}
 */
export function getInputInfo (title: string, placeHolder: string, reg: RegExp = /^[a-zA-Z0-9]*$/): Promise<string | undefined> {
    return new Promise((resolve, reject) => {
        try {
            window.showInputBox({
                password: false,
                ignoreFocusOut: true,
                placeHolder: placeHolder,
                prompt: title,
                validateInput: function (text: string): string {
                    if (check(text, reg)) {
                        return "";
                    } else {
                        return "Illegal input";
                    }
                }
            }).then((msg: string | undefined) => {
                resolve(msg);
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 选择文件
 * @param param 
 * @returns 
 */
export function selectFile ({
    files = true,
    folders = false,
    many = false,
    filters = undefined,
    title = '选择文件',
    openLabel = '确认',
    defaultUri
}: SelectFileParams): Promise<{uri:Uri[], file:boolean, dirName:string}> {
    return new Promise((resolve, reject) => {
        try {
            if (files && folders) folders = false;
            if (!files && !folders) files = true;
            if (folders && many) many = false;
            if (folders && filters) filters = undefined;
            if (isString(defaultUri) && (defaultUri as string).length > 0) {
                defaultUri = Uri.file(defaultUri as string);
            } else {
                defaultUri = undefined;
            }
            window.showOpenDialog({
                defaultUri: defaultUri as Uri | undefined,
                canSelectFiles: files,
                canSelectFolders: folders,
                canSelectMany: many,
                filters,
                title,
                openLabel
            }).then(res => {
                if (res) {
                    let dirName;
                    if (files) {
                        dirName = dirname(res[0].fsPath);
                    } else {
                        dirName = res[0].path;
                    }
                    resolve({ uri: res, file: files, dirName });
                } else {
                    throw new Error('undefinded select data');
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 设置消息弹框
 * @param param
 * @returns 
 */
export function setMessage<T extends MessageItem> ({
    type = 'information',
    message,
    modal = false,
    detail,
    items
}: MessageBoxType<T>): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
        try {
            if (!type) type = 'information';
            if (!message) {
                throw new Error('Null message for MessageBox');
            }
            if (!modal) detail = undefined;
            isUndefined(items) ? 
                // items是undefinded不传
                getMessageBoxAllData()[type](message, {
                    modal,
                    detail
                }).then(res => {
                    resolve(res as undefined);
                }) : 
                getMessageBoxAllData()[type](message, {
                    modal,
                    detail
                }, ...(items as T[])).then(res => {
                    resolve(res);
                });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 获取消息弹框所有方法
 * @returns 
 */
function getMessageBoxAllData () {
    return {
        information: window.showInformationMessage,
        warning: window.showWarningMessage,
        error: window.showErrorMessage
    }
}

/**
 * 设置底部状态栏文字内容
 * @param message 
 * @param option 
 * @param callback 
 * @param callbackParam 
 * @returns 
 */
export function setStatusBar (message: string | StatusBarIconMessage, option?:StatusBarParam, callback?: StatusBarCallback, ...callbackParam: any[]): Disposable {
    if (isObject(message)) {
        message = `$(${(message as StatusBarIconMessage).icon})${(message as StatusBarIconMessage).message}`;
    }
    if (isUndefined(option)) 
        return window.setStatusBarMessage(message as string);
    let thenable: Thenable<any>;
    if (isNumber(option)) {
        thenable = <Promise<void>>new Promise((resolve, reject) => {
            try {
                setTimeout(() => {
                    callback?.(...callbackParam);
                    resolve();
                }, option as number);
            } catch (error) {
                reject(error);
            }
        })
    } else {
        thenable = option as Thenable<any>;
    }
    return window.setStatusBarMessage(message as string, thenable);
}

/**
 * 调用进度条api
 * @param options 
 * @param task 
 * @returns 
 */
export function showProgress<R> (options: ProgressOptionsNew, task: ProgressTaskType<R>) {
    if (isString(options.location)) 
        options.location = getProgressLocation(options.location as ProgressLocationData);
    return window.withProgress(options as ProgressOptions, task);
}

/**
 * 获取location的值
 * @param name 
 * @returns 
 */
function getProgressLocation (name: ProgressLocationData) {
    return ProgressLocation[name];
}