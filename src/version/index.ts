import { version } from "vscode";
import { errHandle } from "../error";
import { getWorkSpace, setWorkSpace } from "../workspace";

/**
 * 是否是开发环境，本地调试环境变量是development，生产环境没有NODE_ENV
 * @returns 
 */
export function isDev (): boolean {
    return process.env.NODE_ENV === "development";
}

/**
 * 获取版本号
 * @returns {string} 版本号
 */
export function getVersion (): string {
    const json = require('../../package.json');
    return json.version as string;
}

/**
 * 获取当前版本状态
 * @returns 
 */
export function checkVersion (): boolean {
    const config = getWorkSpace("wangyige.global");
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
export function refreshVersion () {
    setWorkSpace("wangyige.global", "VSCodeVersion", version)
        .then(() => {
            return setWorkSpace("wangyige.global", "ExtensionVersion", getVersion());
        }, err => {
            errHandle(err);
        }).then(() => {}, err => {
            errHandle(err);
        });
}