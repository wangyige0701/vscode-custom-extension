import { version } from "vscode";
import { errHandle } from "../error";
import { getWorkSpace, setWorkSpace } from "../workspace";
import { getVersion } from ".";

/**
 * 获取当前版本状态
 * @returns 
 */
export function checkVersion (id: string): boolean {
    const config = getWorkSpace("wangyige."+id);
    const vscode = config.get("VSCodeVersion");
    const extension = config.get("ExtensionVersion");
    if (!vscode || !extension) 
        return false;
    if (vscode !== version || extension !== getVersion()) 
        return false;
    return true;
}

/**
 * 更新版本信息
 */
export function refreshVersion (id: string) {
    setWorkSpace("wangyige."+id, "VSCodeVersion", version)
        .then(() => {
            return setWorkSpace("wangyige."+id, "ExtensionVersion", getVersion());
        }, err => {
            errHandle(err);
        }).then(() => {}, err => {
            errHandle(err);
        });
}