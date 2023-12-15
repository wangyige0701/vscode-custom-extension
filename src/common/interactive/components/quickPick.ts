import type { CancellationToken, QuickPickItem, QuickPickOptions } from "vscode";
import type { QuickPickItemCallback, QuickPickItemsOptions, QuickPickPanelOptions, } from "../@types";
import { window } from "vscode";
import { firstStrUpperCase, isArray, isFunction, isPromise, isString } from "@/utils";

/**
 * 创建并打开一个可选列表
 */
export function createQuickPick (items: QuickPickItemsOptions[], options: QuickPickPanelOptions = {}) {
    function _check (value: any): value is QuickPickItemCallback {
        return isFunction(value) || isPromise(value);
    }
    const callbackMap: { [key: string]: QuickPickItemCallback | undefined } = {};
    // 属性整理
    for (const key of items) {
        // 判断回调函数属性是否被冻结
        if (!Object.isFrozen(key.callback)) {
            callbackMap[key.label] = key.callback??void 0;
            delete key.callback;
        }
    }
    const quickPick = window.createQuickPick();
    quickPick.items = items;
    quickPick.onDidChangeSelection(selection => {
        if (!selection[0]) {
            return;
        }
        const callback = callbackMap[selection[0].label] ?? void 0;
        if (!callback || !_check(callback)) {
            return;
        }
        Promise.resolve(
            isFunction(callback) ? callback.call(quickPick, selection[0]) : callback
        ).catch(err => {
            throw new Error("CreateQuickPick Error", { cause: err });
        });
    });
    // 是否立即显示
    const isShow = options.show ?? true;
    delete options.show;
    // 自定义属性赋值
    for (const key in options) {
        // @ts-ignore
        const value = options[key];
        if (isFunction(value)) {
            // @ts-ignore
            quickPick[`on${firstStrUpperCase(key)}`]?.(value.bind(quickPick));
            continue;
        }
        // @ts-ignore
        quickPick[key] = value;
    }
    quickPick.onDidHide(() => {
        quickPick.dispose();
    });
    isShow && quickPick.show();
    return quickPick;
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
