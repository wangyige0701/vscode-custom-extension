import { window } from "vscode";
import type { CancellationToken, QuickPickItem, QuickPickOptions } from "vscode";
import type { QuickPickItemCallback, QuickPickLabelOptions } from "./types";
import { isArray, isFunction, isPromise, isString } from "..";

/**
 * 创建并打开一个可选列表
 */
export function createAndShowQuickPick<T> (options: QuickPickLabelOptions<T>[]): Promise<void | T> {
    function _check (value: any): value is QuickPickItemCallback<T> {
        return isFunction(value) || isPromise(value);
    }
    const callbackMap: { [key: string]: QuickPickItemCallback<T> } = {},
    items: QuickPickItem[] = [];
    for (const key of options) {
        callbackMap[key.options.label] = key.callback;
        items.push(key.options);
    }
    return new Promise((resolve, reject) => {
        const quickPick = window.createQuickPick();
        quickPick.items = items;
        quickPick.onDidChangeSelection(selection => {
            if (selection[0]) {
                const callback = callbackMap[selection[0].label];
                if (_check(callback)) {
                    Promise.resolve(
                        isFunction(callback) ? callback(selection[0]) : callback
                    ).then((res: T) => {
                        resolve(res);
                    }).catch(err => {
                        reject(new Error("CreateQuickPick Error", { cause: err }));
                    });
                } else {
                    resolve();
                }
            }
        });
        quickPick.onDidHide(() => {
            quickPick.dispose();
        });
        quickPick.show();
    });
}

/**
 * 显示一个可选列表
 */
export function showQuickPick(items: string[], options?: QuickPickOptions & { canPickMany?: false }, token?: CancellationToken): Promise<string>;
export function showQuickPick(items: string[], options: QuickPickOptions & { canPickMany: true }, token?: CancellationToken): Promise<string[]>;
export function showQuickPick<T extends QuickPickItem>(items: T[], options?: QuickPickOptions & { canPickMany?: false }, token?: CancellationToken): Promise<T>;
export function showQuickPick<T extends QuickPickItem>(items: T[], options: QuickPickOptions & { canPickMany: true }, token?: CancellationToken): Promise<T[]>;
export function showQuickPick<T extends QuickPickItem> (items: T[] | string[], options?: QuickPickOptions, token?: CancellationToken) {
    if (isArray(items) && (items as string[]).every(item => isString(item))) {
        return Promise.resolve(window.showQuickPick((items as string[]), options, token));
    }
    return Promise.resolve(window.showQuickPick<T>((items as T[]), options, token));
}