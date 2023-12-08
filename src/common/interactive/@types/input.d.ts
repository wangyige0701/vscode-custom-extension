import type { Event, InputBox, InputBoxOptions, QuickInputButton } from "vscode";

/** 排除validateInput属性的剩余属性 */
type ShowInputBoxNeedOptions = Omit<InputBoxOptions, "validateInput">;

type KeyofShowInputBoxNeedOptions = keyof ShowInputBoxNeedOptions;

export type InputOptions = Pick<ShowInputBoxNeedOptions, KeyofShowInputBoxNeedOptions> & {
    regexp?: RegExp;
    error?: string;
};

/** 去除不需要的属性 */
type CreateInputNeedOptions = Omit<InputBox, "show" | "items" | "dispose" | "hide">;

type InputEventToCallback<T> = T extends Event<infer K> ? (this: InputBox, params: K) => void : T;

export type CreateInputOptions = RemoveOnName<{
    -readonly [key in keyof CreateInputNeedOptions]?: InputEventToCallback<CreateInputNeedOptions[key]>;
} & {
    /** 是否立即显示面板，不填则默认立即打开 */
    show?: boolean;
}>;

export type InputBoxTarget = QuickInputButton[]