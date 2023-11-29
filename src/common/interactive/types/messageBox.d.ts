import type { MessageItem } from "vscode";

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

/** 继承MessageItem的类型 */
export type MessageItemExtend = MessageItem & {
    [key: string]: any;
}