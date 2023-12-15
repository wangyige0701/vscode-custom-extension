import type { MessageBoxType, MessageItemExtend } from "../@types";
import { window } from 'vscode';
import { isUndefined } from '@/utils';

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
export function showMessage ({
    type = 'information',
    message,
    modal = false,
    detail,
    items
}: MessageBoxType<MessageItemExtend>): Promise<MessageItemExtend | undefined> {
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
            ? getMessageBoxAllData[type]<MessageItemExtend>(message, {
                modal,
                detail
            })
            : getMessageBoxAllData[type]<MessageItemExtend>(message, {
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
