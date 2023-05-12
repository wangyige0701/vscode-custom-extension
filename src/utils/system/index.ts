import { commands } from "vscode";

/**
 * 重启窗口
 */
export function windowReload () {
    commands.executeCommand('workbench.action.reloadWindow');
}