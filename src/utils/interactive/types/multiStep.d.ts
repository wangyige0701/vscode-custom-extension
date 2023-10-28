import type { InputBox, QuickPick, QuickPickItem } from "vscode";
import type { InputBoxTarget } from "./input";
import type { QuickPickPanelOptions } from "./quickPick";

export type Complete<T> = {
    /** 当需要给面板添加后退按钮时，可以通过此事件接收结果 */
    $complete?: (params: T, nextStep: (ignore?: boolean) => (() => void)) => any;
};

export type ShowInputBoxValidation = (value: string) => InputBox["validationMessage"];

export type ShowQuickPickOptions<T> = QuickPickPanelOptions & {
    step?: number;
    totalSteps?: number;
    placeHolder?: string;
    canPickMany?: boolean;
} & SameTypes & Complete<T>;

export type MultiStepCollectFunc = Function | InputBox | QuickPick<QuickPickItem>;

export type MultiStepInputBoxExtraType = { 
    step?: number;
    totalSteps?: number
    buttons?: InputBoxTarget;
    /** 输入框代理初始值，返回上一级时保留上次的输入文本 */
    $proxy?: boolean;
    /** 多步骤输入框点击按钮时，触发的回调函数 */
    $triggerButton?: QuickPickPanelOptions["didTriggerButton"]
} & SameTypes;

type SameTypes = {
    /** 是否显示左上角的返回按键。如果设置了允许多步骤状态下自动返回上一级，则不用设置。 */
    $backButton?: boolean;
    /** 是否在多步骤任务时允许点击返回按钮自动返回上一级 */
    $back?: boolean;
    /** 从下一级页面返回后触发 */
    $comeBack?: () => void;
    /** 将要返回到上一级页面前触发 */
    $goBack?: () => void;
};