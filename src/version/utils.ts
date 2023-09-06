import { version as vscVersion } from "vscode";
import { errlog } from "../error";
import { getWorkSpace, setWorkSpace } from "../workspace";
import { getVersion } from ".";

/**
 * 根据id获取指定类型的储存数据
 * @param id 
 * @param type 
 */
export function getVersionById (id: string, type: 'VSCodeVersion'|'ExtensionVersion') {
    return getWorkSpace("wangyige."+id).get(type);
}

/**
 * 获取当前版本状态
 * @param id 指定id的版本
 * @param checkVsc 是否需要校验vscode的版本
 */
export function checkVersion (id: string, checkVsc: boolean = true): boolean {
    const config = getWorkSpace("wangyige."+id);
    const vscode = config.get("VSCodeVersion");
    const extension = config.get("ExtensionVersion");
    if ((checkVsc && !vscode) || !extension) {
        return false;
    }
    if ((checkVsc && vscode !== vscVersion) || extension !== getVersion()) {
        return false;
    }
    return true;
}

/** 更新版本信息 */
export async function refreshVersion (id: string, refreshVsc: boolean = true) {
    await Promise.resolve(
        setWorkSpace("wangyige."+id, "ExtensionVersion", getVersion())
    ).then(() => {
        if (refreshVsc) {
            return Promise.resolve(setWorkSpace("wangyige."+id, "VSCodeVersion", vscVersion));
        }
    }).then(() => {
        return Promise.resolve();
    }).catch(err => {
        errlog(err);
    });
}