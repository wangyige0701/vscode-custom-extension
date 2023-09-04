import { commands } from "vscode";

/** 重启窗口 */
export function windowReload () {
    commands.executeCommand('workbench.action.reloadWindow');
}

/** 获取node主模块文件路径 */
export function getNodeModulePath (): string {
    const module = require.main;
    if (!module) {
        return '';
    }
    return module.filename;
}