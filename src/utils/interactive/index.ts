import { Uri, window } from 'vscode';
import { check, isString } from '../index';
import { dirname } from 'path';

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

interface SelectFileParams {
    files?: boolean;
    folders?: boolean;
    many?: boolean; // 允许选择多个文件
    filters?: { [name: string]: string[] };
    title?: string;
    openLabel?: string;
    defaultUri?: Uri | string;
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