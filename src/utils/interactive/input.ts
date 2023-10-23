import { window } from "vscode";

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
                    if (reg.test(text)) {
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