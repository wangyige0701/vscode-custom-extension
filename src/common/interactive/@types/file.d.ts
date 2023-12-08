import type { Uri } from "vscode";

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