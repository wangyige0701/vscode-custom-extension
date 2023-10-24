import { window } from "vscode";
import type { CancellationToken, InputBoxOptions } from "vscode";
import type { InputOptions } from "./types";

/**
 * 调用输入框api获取输入内容
 * @param params 配置项
 * @param validateInput 自定义校验规则
 * @param token 关闭输入框的token
 */
export function showInputBox ({
    title,
    prompt,
    placeHolder,
    regexp = /^[a-zA-Z0-9]*$/,
    error = "Illegal input",
    password = false,
    ignoreFocusOut = true,
    value,
    valueSelection
}: InputOptions, validateInput?: InputBoxOptions["validateInput"], token?: CancellationToken): Promise<string | undefined> {
    return new Promise((resolve, reject) => {
        Promise.resolve(
            window.showInputBox({
                prompt,
                title,
                password,
                ignoreFocusOut,
                placeHolder,
                value,
                valueSelection,
                validateInput: validateInput ? validateInput : function (text: string): string {
                    if (regexp.test(text)) {
                        return "";
                    } else {
                        return error;
                    }
                }
            }, token)
        ).then(msg => {
            resolve(msg);
        }).catch(err => {
            reject(new Error('InputBox Error', { cause: err }));
        });
    });
}