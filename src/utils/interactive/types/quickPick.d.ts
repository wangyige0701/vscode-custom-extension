import type { Event, QuickPick, QuickPickItem } from "vscode";

export type QuickPickItemCallback = ((...data: any[]) => any) | { then: Promise<any>["then"] };

/** 选择面板列表元素的属性 */
export type QuickPickItemsOptions = {
    [key in keyof QuickPickItem]: QuickPickItem[key];
} & {
    callback?: QuickPickItemCallback;
}

/** 不需要忽略的属性 */
type NeedQuickPickPanelOptions = Omit<QuickPick<QuickPickItem>, "show" | "items" | "dispose" | "hide">;

type QuickPickEventToCallback<T> = T extends Event<infer K> ? (this: QuickPick<QuickPickItem>, params: K) => void : T;

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
export type QuickPickPanelOptionsWhichEvent = Exclude<IncludeEventOptions<QuickPick<QuickPickItem>, Event<any>>, undefined>;

export type QuickPickPanelOptionsWhichCallback = RemoveOnString<QuickPickPanelOptionsWhichEvent>;