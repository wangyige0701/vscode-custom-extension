import type { MessageBoxMethodType, MessageBoxType } from "../types";
import { MessageItem, window } from 'vscode';
import { isUndefined } from '../../../utils';

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
            reject(new Error('MessageBox Error', { cause: err }));
        });
    });
}

/** 带确认按钮的消息弹框 */
export function showMessageWithConfirm (message: string, type: MessageBoxMethodType = "information") {
    return showMessage({
        type,
        message,
        items: [{
            id: 0,
            title: '确认'
        }]
    });
}