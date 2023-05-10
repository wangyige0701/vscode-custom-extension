import { Uri, window } from 'vscode';
import { check } from '../index';
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
}

var selectFileDefaultUri: Uri | undefined = undefined;

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
    openLabel = '确认'
}: SelectFileParams): Promise<{uri:Uri[], file:boolean}> {
    if (files && folders) folders = false;
    if (!files && !folders) files = true;
    if (folders && many) many = false;
    if (folders && filters) filters = undefined;
    return new Promise((resolve, reject) => {
        window.showOpenDialog({
            defaultUri: selectFileDefaultUri,
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
                // 设置默认选择路径
                selectFileDefaultUri = Uri.file(dirName);
                resolve({ uri: res, file: files });
            } else {
                reject();
            }
        });
    });
}