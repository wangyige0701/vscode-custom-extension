import { WorkspaceConfiguration, workspace } from "vscode";

/**
 * 获取工作区配置
 * @param name 
 * @returns 
 */
export function getWorkSpace (name: string): WorkspaceConfiguration {
    return workspace.getConfiguration(name);
}


/**
 * 更新工作区配置
 * @param name 
 * @param param 
 * @param value 
 */
export function setWorkSpace (name: string, param: string, value: any): Thenable<void> {
    return getWorkSpace(name).update(param, value, true);
}