import { Disposable, MessageItem, ProgressLocation, ProgressOptions, Uri, window } from 'vscode';
import { check, isNumber, isObject, isString, isUndefined } from '../index';
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
        Promise.resolve(
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
            })
        ).then(msg => {
            resolve(msg);
        }).catch(err => {
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
        if (files && folders) {
            folders = false;
        }
        if (!files && !folders) {
            files = true;
        }
        if (folders && many) {
            many = false;
        }
        if (folders && filters) {
            filters = void 0;
        }
        if (isString(defaultUri) && defaultUri.length > 0) {
            defaultUri = Uri.file(defaultUri);
        } else {
            defaultUri = void 0;
        }
        Promise.resolve(
            window.showOpenDialog({
                defaultUri: defaultUri as Uri | undefined,
                canSelectFiles: files,
                canSelectFolders: folders,
                canSelectMany: many,
                filters,
                title,
                openLabel
            })
        ).then(res => {
            if (res) {
                let dirName;
                if (files) {
                    dirName = dirname(res[0].fsPath);
                } else {
                    dirName = res[0].path;
                }
                return resolve({ uri: res, file: files, dirName });
            }
            reject();
        }).catch(err => {
            reject(new Error('ShowOpenDialog Error', { cause: err }));     
        });
    });
}

/** 获取消息弹框所有方法 */
const getMessageBoxAllData = {
    information: window.showInformationMessage,
    warning: window.showWarningMessage,
    error: window.showErrorMessage
};

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
        if (!type) {
            type = 'information';
        }
        if (!message) {
            return reject('Null message for MessageBox');
        }
        if (!modal) {
            detail = void 0;
        }
        Promise.resolve(
            // items是undefinded不传
            isUndefined(items) 
            ? getMessageBoxAllData[type]<T>(message, {
                modal,
                detail
            })
            : getMessageBoxAllData[type]<T>(message, {
                modal,
                detail
            }, ...items)
        ).then(res => {
            resolve(res);
        }).catch(err => {
            throw new Error('MessageBox Error', { cause: err });
        });
    });
}

/** 带确认按钮的消息弹框 */
export function showMessageWithConfirm (message: string) {
    return showMessage({
        message,
        items: [{
            id: 0,
            title: '确认'
        }]
    });
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
 * 调用进度条api
 * @param options 
 * @param task 
 */
export function showProgress<R> (options: ProgressOptionsNew, task: ProgressTaskType<R>): Thenable<R> {
    if (isString(options.location)) {
        options.location = getProgressLocation(options.location as ProgressLocationData);
    }
    return window.withProgress(options as ProgressOptions, task);
}

/**
 * 获取location的值
 * @param name 
 */
function getProgressLocation (name: ProgressLocationData) {
    return ProgressLocation[name];
}