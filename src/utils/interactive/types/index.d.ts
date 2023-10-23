import type { CancellationToken, Progress, ProgressLocation, Uri, QuickPickItem, StatusBarAlignment, InputBoxOptions } from "vscode";

/**
 * 选择文件方法参数
 */
export interface SelectFileParams {
    /**
     * 选择文件
     */
    files?: boolean;
    /**
     * 选择文件夹
     */
    folders?: boolean;
    /**
     * 允许选择多个文件
     */
    many?: boolean;
    /**
     * 文件选择过滤规则
     */
    filters?: { [name: string]: string[] };
    /**
     * 标题
     */
    title?: string;
    /**
     * 确认按钮的文字
     */
    openLabel?: string;
    /**
     * 默认打开的路径
     */
    defaultUri?: Uri | string;
}

/** 消息盒子类型 */
export type MessageBoxMethodType = 'information' | 'error' | 'warning';

/**
 * 消息框调用参数
*/
export interface MessageBoxType<T> {
    /**
     * 类型
    */
    type?: MessageBoxMethodType;

    /**
     * 提示消息
    */
    message: string;

    /**
     * 是否调用系统弹框
    */
    modal?: boolean;

    /**
     * 详细描述，只在modal下显示
    */
    detail?: string;

    /**
     * 弹框按钮
    */
    items?: T[]
}

/**
 * 状态栏参数
*/
export type StatusBarParam = number | Thenable<any>;

export type StatusBarCallback = (...data: any[]) => any;

export type StatusBarIconMessage = {
    /**
     * 字符串开头添加的图标
     */
    icon: string;

    /**
     * 消息字符串
     */
    message: string; 
};

export type ProgressLocationData = keyof typeof ProgressLocation;

/**
 * 进度条数据类型
*/
export interface ProgressOptionsNew {
    location: ProgressLocationData | { viewId: string } | ProgressLocation;
    title?: string;
    cancellable?: boolean;
}

export type ProgressTaskType<R> = (progress: Progress<{ message?: string; increment?: number }>, token: CancellationToken) => Thenable<R>

export interface StatusBarItemOptions {
    alignment?: keyof typeof StatusBarAlignment;
    priority?: number;
    command?: string;
}

export type QuickPickItemCallback<T> = ((data: QuickPickItem) => T) | { then: Promise<T>["then"] };

export interface QuickPickLabelOptions<T> {
    callback: QuickPickItemCallback<T>;
    options: Pick<QuickPickItem, keyof QuickPickItem>
}

type NeedInputOptions = Omit<InputBoxOptions, "validateInput">;

type KeyofNeedInputOptions = keyof NeedInputOptions;

export type InputOptions = Pick<NeedInputOptions, KeyofNeedInputOptions> & {
    regexp?: RegExp;
    error?: string;
};