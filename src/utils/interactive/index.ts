import { Disposable, MessageItem, ProgressLocation, ProgressOptions, Uri, window } from 'vscode';
import { $undefined, check, isNumber, isObject, isString, isUndefined } from '../index';
import { dirname } from 'path';
import { 
    MessageBoxType, 
    ProgressLocationData, 
    ProgressOptionsNew, 
    ProgressTaskType, 
    SelectFileParams, 
    StatusBarCallback, 
    StatusBarIconMessage, 
    StatusBarParam 
} from './type';

/**
 * 调用输入框api获取输入内容
 * @param title 输入框下方提示标题
 * @param placeHolder 占位符
 * @param reg 正则校验规则
 */
export function getInputInfo (title: string, placeHolder: string, reg: RegExp = /^[a-zA-Z0-9]*$/): Promise<string | undefined> {
    return new Promise((resolve, reject) => {
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
        }, err => {
            reject(new Error('InputBox Error', { cause: err }));
        });
    });
}

/**
 * 选择文件
 * @param param 
 */
export function selectFile ({
    files = true,
    folders = false,
    many = false,
    filters = void 0,
    title = '选择文件',
    openLabel = '确认',
    defaultUri
}: SelectFileParams): Promise<{uri:Uri[], file:boolean, dirName:string}> {
    return new Promise((resolve, reject) => {
        try {
            if (files && folders) folders = false;
            if (!files && !folders) files = true;
            if (folders && many) many = false;
            if (folders && filters) filters = $undefined();
            if (isString(defaultUri) && defaultUri.length > 0) {
                defaultUri = Uri.file(defaultUri);
            } else {
                defaultUri = $undefined();
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
                    reject();
                }
            }, err => {
                reject(new Error('ShowOpenDialog Error', { cause: err }));
            });
        } catch (error) {
            reject(new Error('Catch Error', { cause: error }));
        }
    });
}

/**
 * 设置消息弹框
 * @param param
 */
export function showMessage<T extends MessageItem> ({
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
                reject('Null message for MessageBox');
                return;
            }
            if (!modal) {
                detail = $undefined();
            }
            // items是undefinded不传
            isUndefined(items) 
            ?   getMessageBoxAllData()[type](message, {
                    modal,
                    detail
                }).then(res => {
                    resolve(res as undefined);
                }, err => {
                    reject(new Error('MessageBox Error', { cause: err }));
                }) 
            :   getMessageBoxAllData()[type](message, {
                    modal,
                    detail
                }, ...items).then(res => {
                    resolve(res);
                }, err => {
                    reject(new Error('MessageBox Error', { cause: err }));
                });
        } catch (error) {
            reject(new Error('Catch Error', { cause: error }));
        }
    });
}

/** 获取消息弹框所有方法 */
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
            try {
                setTimeout(() => {
                    callback?.(...callbackParam);
                    resolve();
                }, option);
            } catch (error) {
                reject(new Error('Catch Error', { cause: error }));
            }
        })
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
 * 调用进度条api
 * @param options 
 * @param task 
 */
export function showProgress<R> (options: ProgressOptionsNew, task: ProgressTaskType<R>) {
    if (isString(options.location)) 
        options.location = getProgressLocation(options.location as ProgressLocationData);
    return window.withProgress(options as ProgressOptions, task);
}

/**
 * 获取location的值
 * @param name 
 */
function getProgressLocation (name: ProgressLocationData) {
    return ProgressLocation[name];
}