import { window } from "vscode";
import type { QuickPickItem } from "vscode";
import { QuickPickItemCallback, QuickPickLabelOptions } from "./types";
import { isFunction, isPromise } from "..";

/**
 * 打开一个选择面板
 */
export function openQuickPick (options: QuickPickLabelOptions) {
    function _check (value: any): value is QuickPickItemCallback {
        return isFunction(value) || isPromise(value);
    }
    const items: QuickPickItem[] = [];
    for (const key in options) {
        const item: QuickPickItem = { label: key }, value = options[key];
        items.push(item);
        if (_check(value)) {
            continue;
        }
        item.alwaysShow = value.alwaysShow;
        item.description = value.description;
        item.detail = value.detail;
        item.picked = value.picked;
        item.buttons = value.buttons;
        item.kind = value.kind;
    }
    return new Promise((resolve, reject) => {
        const quickPick = window.createQuickPick();
        quickPick.items = items;
        quickPick.onDidChangeSelection(selection => {
            if (selection[0]) {
                const target = options[selection[0].label];
                let callback: QuickPickItemCallback;
                if (!_check(target)) {
                    callback = target.callback;
                } else {
                    callback = target;
                }
                Promise.resolve(callback(selection[0])).then(resolve).catch(err => {
                    reject(new Error("CreateQuickPick Error", { cause: err }));
                });
            }
        });
    });
}