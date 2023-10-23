import type { CancellationToken, Progress, ProgressLocation, Uri, QuickPickItem, StatusBarAlignment } from "vscode";

/**
 * 选择文件方法参数
 */
interface SelectFileParams {
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

type MessageBoxMethodType = 'information' | 'error' | 'warning';
/**
 * 消息框调用参数
*/
interface MessageBoxType<T> {
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
type StatusBarParam = number | Thenable<any>;

type StatusBarCallback = (...data: any[]) => any;

type StatusBarIconMessage = {
    /**
     * 字符串开头添加的图标
     */
    icon: string;

    /**
     * 消息字符串
     */
    message: string; 
};

type ProgressLocationData = keyof typeof ProgressLocation;

/**
 * 进度条数据类型
*/
interface ProgressOptionsNew {
    location: ProgressLocationData | { viewId: string } | ProgressLocation;
    title?: string;
    cancellable?: boolean;
}

type ProgressTaskType<R> = (progress: Progress<{ message?: string; increment?: number }>, token: CancellationToken) => Thenable<R>

interface StatusBarItemOptions {
    alignment?: keyof typeof StatusBarAlignment;
    priority?: number;
    command?: string;
}

type QuickPickItemCallback = ((...any: any[]) => void) | ((...any: any[]) => { then: (...any: any[]) => any});

type QuickPickItemExcludeLabel = keyof Omit<QuickPickItem, "label">;

type GetQuickPickItemOptions<T extends QuickPickItemExcludeLabel> = QuickPickItem[T];

type KeyOfQuickPickItem = {
    [k in QuickPickItemExcludeLabel]?: QuickPickItem[k]
} & {
    label: string;
};

type MergePickOptions = {
    [k in QuickPickItemExcludeLabel]?: QuickPickItem[k]
} & {
    callback: QuickPickItemCallback;
};

interface QuickPickLabelOptions {
    [key: string]: QuickPickItemCallback | MergePickOptions;
}