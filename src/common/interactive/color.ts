import { ThemeColor } from "vscode";

/**
 * 创建一个颜色
 */
export function createThemeColor (color: string) {
    return new ThemeColor(color);
}