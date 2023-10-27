import type { Event, QuickPick, QuickPickItem, ThemeIcon, Uri } from "vscode";

type QuickPickType = QuickPick<QuickPickItem>;

export type QuickPickItemCallback = ((this: QuickPickType, item: QuickPickItemsOptions) => any) | { then: Promise<void>["then"] };

/** 选择面板列表元素的属性 */
export type QuickPickItemsOptions = {
    [key in keyof QuickPickItem]: QuickPickItem[key];
} & {
    /** 点击子元素时自动触发的回调函数，this指向QuickPick实例本身，并传入当前点击的元素对象 */
    callback?: QuickPickItemCallback;
    iconPath?: Uri | ThemeIcon | {dark: Uri, light: Uri};
};

/** 不需要忽略的属性 */
type NeedQuickPickPanelOptions = Omit<QuickPickType, "show" | "items" | "dispose" | "hide">;

type QuickPickEventToCallback<T> = T extends Event<infer K> ? (this: QuickPickType, params: K) => void : T;

/** 选择面板内的属性 */
export type QuickPickPanelOptions = RemoveOnName<{
    -readonly [key in keyof NeedQuickPickPanelOptions]?: QuickPickEventToCallback<NeedQuickPickPanelOptions[key]>;
} & {
    /** 是否立即显示面板，不填则默认立即打开 */
    show?: boolean;
}>;

export type KeyofQuickPickPanelOptions = keyof QuickPickPanelOptions;

type IncludeEventOptions<T, F> = {
    [K in keyof T]: T[K] extends F ? K : never;
}[keyof T];

/** 所有事件属性名 */
export type QuickPickPanelOptionsWhichEvent = Exclude<IncludeEventOptions<QuickPickType, Event<any>>, undefined>;

export type QuickPickPanelOptionsWhichCallback = RemoveOnString<QuickPickPanelOptionsWhichEvent>;