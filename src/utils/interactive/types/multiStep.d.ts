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
    back?: boolean;
    comeBack?: () => void;
    goBack?: () => void;
} &  Complete<T>;

export type MultiStepCollectFunc = Function | InputBox | QuickPick<QuickPickItem>;

export type MultiStepInputBoxExtraType = { 
    step?: number;
    totalSteps?: number
    back?: boolean;
    $proxy?: boolean;
    buttons?: InputBoxTarget;
    comeBack?: () => void;
    goBack?: () => void;
};