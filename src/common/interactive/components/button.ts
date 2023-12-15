import type { QuickInputButton } from "vscode";
import type { ButtonIcon, MyButtonType } from "../@types";
import { ThemeColor, ThemeIcon } from "vscode";
import { isObject, isString } from "@/utils";

class MyButton implements QuickInputButton {
    constructor (
        public id: string,
        public iconPath: QuickInputButton["iconPath"],
        public tooltip: QuickInputButton["tooltip"],
    ) {}
}

/**
 * 创建一个图标按钮
 */
export function createQuickButton (id: string, icon: ButtonIcon, tooltip?: string): MyButtonType {
    if (isObject(icon) && 'id' in icon) {
        const color = isString(icon.color) ? (new ThemeColor(icon.color)) : void 0;
        (icon as ThemeIcon) = new ThemeIcon(icon.id, color);
    }
    return new MyButton(id, icon, tooltip);
};
