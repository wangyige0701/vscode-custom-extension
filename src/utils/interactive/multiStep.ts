import type { InputOptions, QuickPickItemsOptions, ShowInputBoxValidation, ShowQuickPickOptions, Complete, MultiStepCollectFunc, MultiStepInputBoxExtraType } from "./types";
import { creaetInputBox, createQuickPick } from "./index";
import { QuickInputButtons } from "vscode";
import { isFunction, isString } from "..";

export class MultiStep {
    private static collect: [Function, string | undefined][] = [];

    private static run (func?: MultiStepCollectFunc, inputValue?: string) {
        if (isFunction(func)) {
            this.collect.push([func, inputValue]);
            return;
        }
        const item = this.collect.pop();
        if (item) {
            const callback = item[0];
            const inputValue = item[1];
            callback('back', inputValue);
        }
        func?.hide();
    }

    private static clear () {
        this.collect.splice(0, this.collect.length);
    }

    constructor () {}

    static showInputBox ({
        title,
        prompt,
        placeHolder,
        regexp = /^[a-zA-Z0-9]*$/,
        error = "Illegal input",
        password = false,
        ignoreFocusOut = true,
        value,
        valueSelection,
        step,
        totalSteps,
        back = false,
        $complete,
        $proxy = false,
        buttons,
        comeBack,
        goBack
    }: InputOptions & MultiStepInputBoxExtraType & Complete<string>, validateInput?: ShowInputBoxValidation): Promise<string | void> {
        const lastParam = arguments[arguments.length - 1], secondLastParam = arguments[arguments.length - 2];
        if (secondLastParam === 'back') {
            comeBack?.();
        }
        const oldInputValue: string | undefined = isString(lastParam)?lastParam:void 0;
        const isBack = back === true && step && totalSteps && step <= totalSteps;
        const toCollect = this.showInputBox.bind(this, arguments[0], arguments[1]);
        let collected: boolean = false;
        return new Promise(resolve => {
            const input = creaetInputBox({
                title,
                prompt,
                value: oldInputValue ? oldInputValue : value,
                placeholder: placeHolder,
                ignoreFocusOut,
                valueSelection,
                password,
                step,
                totalSteps,
                didChangeValue (str) {
                    // 格式校验
                    if (!str) {
                        this.validationMessage = "";
                    } else if (validateInput) {
                        this.validationMessage = validateInput(str);
                    } else if (!regexp.test(str)) {
                        this.validationMessage = error;
                    } else {
                        this.validationMessage = "";
                    }
                    this.show();
                },
                didAccept () {
                    $complete?.(this.value);
                    resolve(this.value);
                    if (!isBack) {
                        return;
                    }
                    if (step === totalSteps) {
                        MultiStep.clear();
                        return;
                    }
                    collected = true;
                    MultiStep.run(toCollect, $proxy ? this.value : void 0);
                },
                didHide: () => {
                    if (isBack && !collected) {
                        this.clear();
                    }
                }
            });
            if (isBack && step && step > 1) {
                input.buttons = [QuickInputButtons.Back, ...(buttons || [])];
            }
            input.onDidTriggerButton(item => {
                if (item === QuickInputButtons.Back) {
                    collected = true;
                    goBack?.();
                    this.run();
                }
            });
        });
    }

    /**
     * @param autoCallback 当存在callback属性时是否在选择后自动触发回调函数
     */
    static showQuickPick<T extends QuickPickItemsOptions> (items: T[], options: ShowQuickPickOptions<T> & { canPickMany?: false }, autoCallback?: boolean): Promise<T>;
    static showQuickPick<T extends QuickPickItemsOptions> (items: T[], options: ShowQuickPickOptions<T[]> & { canPickMany: true }, autoCallback?: boolean): Promise<T[]>;
    static showQuickPick<T extends QuickPickItemsOptions> (items: T[], options: ShowQuickPickOptions<T | T[]>, autoCallback: boolean = false): Promise<T | T[]> {
        const lastParam = arguments[arguments.length - 1];
        if (lastParam === 'back') {
            options.comeBack?.();
        }
        const { step, totalSteps } = options;
        const isBack = options.back === true && step && totalSteps && step <= totalSteps;
        const toCollect = this.showQuickPick.bind(this, arguments[0], arguments[1], arguments[2]);
        let collected: boolean = false;
        return new Promise(resolve => {
            if (!autoCallback) {
                for (const target of items) {
                    if ('callback' in target) {
                        Object.freeze(target.callback);
                    }
                }
            }
            if ('placeHolder' in options) {
                options.placeholder = options.placeHolder;
                delete options.placeHolder;
            }
            if ('canPickMany' in options) {
                options.canSelectMany = options.canPickMany;
                delete options.canPickMany;
            }
            const quickPick = createQuickPick(items as QuickPickItemsOptions[], {
                ...options,
                didAccept () {
                    const result = options.canSelectMany ? (this.selectedItems as T[]) : (this.selectedItems[0] as T);
                    options.$complete?.(result);
                    resolve(result);
                    if (!isBack) {
                        return;
                    }
                    if (step === totalSteps) {
                        MultiStep.clear();
                        return;
                    }
                    collected = true;
                    MultiStep.run(toCollect);
                },
                didHide () {
                    if (isBack && !collected) {
                        MultiStep.clear();
                    }
                }
            });
            if (isBack && options.step && options.step > 1) {
                quickPick.buttons = [QuickInputButtons.Back, ...(options.buttons || [])];
            }
            quickPick.onDidTriggerButton(item => {
                if (item === QuickInputButtons.Back) {
                    collected = true;
                    options.goBack?.();
                    this.run();
                }
            });
        });
    }
}