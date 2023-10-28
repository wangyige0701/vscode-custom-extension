import type { 
    InputOptions, 
    QuickPickItemsOptions, 
    ShowInputBoxValidation, 
    ShowQuickPickOptions, 
    Complete, 
    MultiStepCollectFunc, 
    MultiStepInputBoxExtraType 
} from "./types";
import { creaetInputBox } from "./input";
import { createQuickPick } from "./quickPick";
import { QuickInputButtons } from "vscode";
import type { QuickInputButton } from "vscode";
import { isFunction, isString } from "..";

export class MultiStep {
    private static collect: [Function, string | undefined][] = [];

    /**
     * 传入函数则将对应函数插入收集队列，否则从队列中移除元素进行调用
     */
    private static run (func: Exclude<MultiStepCollectFunc, Function>): Promise<void>;
    private static run (func: Function, inputValue?: string): void;
    private static run (func?: MultiStepCollectFunc, inputValue?: string) {
        if (isFunction(func)) {
            this.collect.push([func, inputValue]);
            return;
        }
        return <Promise<void>>new Promise(async resolve => {
            const item = this.collect.pop();
            if (item) {
                const callback = item[0];
                const inputValue = item[1];
                await (inputValue ? callback('back', inputValue) : callback('back'));
            }
            func?.hide();
            resolve();
        });
    }

    /** 清除所有队列数据 */
    private static clear () {
        this.collect.splice(0, this.collect.length);
    }

    /**
     * 创建一个可以显示步骤数的输入框
     */
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
        buttons,
        $back = false,
        $backButton = false,
        $proxy = false,
        $complete,
        $comeBack,
        $goBack,
        $triggerButton
    }: InputOptions & MultiStepInputBoxExtraType & Complete<string>, validateInput?: ShowInputBoxValidation): Promise<string | void | 'back'> {
        let oldInputValue: string | undefined = void 0;
        // 参数判断，如果是通过后退键返回时触发，则倒数第二个参数是'back'，在快速选择模块里是最后一个
        // 同时输入框方法内还会将上一次的value作为最后一个参数传入
        const argsLength = arguments.length;
        if (argsLength > 2) {
            const lastParam = arguments[argsLength - 1], secondLastParam = arguments[argsLength - 2];
            if (secondLastParam === 'back') {
                // 如果当前函数是从返回队列中取出并执行的，调用一次comeBack回调函数
                $comeBack?.();
                delete arguments[argsLength - 2];
            }
            if (isString(lastParam)) {
                oldInputValue = lastParam;
                delete arguments[argsLength - 1];
            }
        }
        const isBack = $back === true && step && totalSteps && step <= totalSteps;
        const toCollect = this.showInputBox.bind(this, arguments[0], arguments[1]);
        let notActiveHide: boolean = true, backLock: boolean = false;
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
                    $complete?.(this.value, (ignore: boolean = false) => {
                        if (!ignore && isBack) {
                            if (step === totalSteps) {
                                MultiStep.clear();
                            } else {
                                notActiveHide = false;
                                MultiStep.run(toCollect, $proxy ? this.value : void 0);    
                            }
                        }
                        return this.hide.bind(this);
                    });
                    resolve(this.value);
                },
                didHide () {
                    // 只有在当前面板没有返回按键并且不是主动点击造成的隐藏时清除队列数据
                    if (isBack && notActiveHide) {
                        MultiStep.clear();
                    }
                }
            });
            // 按钮设置
            let settintButtons: QuickInputButton[] | undefined = void 0;
            if ($backButton || (isBack && step && step > 1)) {
                // 步骤数大于1显示返回按钮
                settintButtons = [QuickInputButtons.Back];
            }
            if (buttons && buttons.length > 0) {
                if (!settintButtons) {
                    settintButtons = [];
                }
                settintButtons.push(...(buttons || []));
            }
            if (settintButtons) {
                input.buttons = settintButtons;
            }
            // 点击按钮的事件处理，返回按钮处理时执行goBack回调函数
            input.onDidTriggerButton(async item => {
                if (!backLock && item === QuickInputButtons.Back) {
                    backLock = true;
                    notActiveHide = false;
                    $goBack?.call(input);
                    if (isBack) {
                        await this.run(input);
                    }
                    resolve('back');
                    input.hide();
                }
            });
            if ($triggerButton) {
                input.onDidTriggerButton($triggerButton);
            }
        });
    }

    /**
     * 创建一个可以显示步骤数的选择框
     * @param autoCallback 当存在callback属性时是否在选择后自动触发回调函数
     */
    static showQuickPick<T extends QuickPickItemsOptions> (items: T[], options: ShowQuickPickOptions<T> & { canPickMany?: false }, autoCallback?: boolean): Promise<T>;
    static showQuickPick<T extends QuickPickItemsOptions> (items: T[], options: ShowQuickPickOptions<T[]> & { canPickMany: true }, autoCallback?: boolean): Promise<T[]>;
    static showQuickPick<T extends QuickPickItemsOptions> (items: T[], options: ShowQuickPickOptions<T | T[]>, autoCallback: boolean = false): Promise<T | T[] | 'back'> {
        const argsLength = arguments.length;
        if (argsLength > 1) {
            const lastParam = arguments[arguments.length - 1];
            if (lastParam === 'back') {
                options.$comeBack?.();
                delete arguments[arguments.length - 1];
            }
        }
        const { step, totalSteps } = options;
        const isBack = options.$back === true && step && totalSteps && step <= totalSteps;
        const toCollect = this.showQuickPick.bind(this, arguments[0], arguments[1], arguments[2]);
        let notActiveHide: boolean = true, backLock: boolean = false;
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
                    options.$complete?.(result, (ignore: boolean = false) => {
                        if (!ignore && isBack) {
                            if (step === totalSteps) {
                                MultiStep.clear();
                            } else {
                                notActiveHide = false;
                                MultiStep.run(toCollect);
                            }
                        }
                        return this.hide.bind(this);
                    });
                    resolve(result);
                },
                didHide () {
                    if (isBack && notActiveHide) {
                        MultiStep.clear();
                    }
                }
            });
            let settintButtons: QuickInputButton[] | undefined = void 0;
            if (options.$backButton || (isBack && options.step && options.step > 1)) {
                settintButtons = [QuickInputButtons.Back];
            }
            if (options.buttons && options.buttons.length > 0) {
                if (!settintButtons) {
                    settintButtons = [];
                }
                settintButtons.push(...(options.buttons || []));
            }
            if (settintButtons) {
                quickPick.buttons = settintButtons;
            }
            quickPick.onDidTriggerButton(async item => {
                if (!backLock && item === QuickInputButtons.Back) {
                    backLock = true;
                    notActiveHide = false;
                    options.$goBack?.call(quickPick);
                    if (isBack) {
                        await this.run(quickPick);
                    }
                    resolve('back');
                    quickPick.hide();
                }
            });
        });
    }
}