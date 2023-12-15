import { ThemeColor, ThemeIcon } from "vscode";
import { isString } from "@/utils";

/**
 * 创建一个图片
 */
export function createThemeIcon (id: string, color?: string) {
    const theColor = isString(color) ? (new ThemeColor(color)) : void 0;
    return new ThemeIcon(id, color);
}
