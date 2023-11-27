import type { StatusBarAlignment } from "vscode";

/** 状态栏元素配置项 */
export interface StatusBarItemOptions {
    alignment?: keyof typeof StatusBarAlignment;
    priority?: number;
    command?: string;
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