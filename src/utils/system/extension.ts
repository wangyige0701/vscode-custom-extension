import type { Uri } from "vscode";

/**
 * 全局获取扩展uri
 */
export default class ExtensionUri {
    private static extensionUri: Uri | null;

    /** 扩展uri赋值 */
    static set (uri: Uri) {
        if (!uri) {
            throw new Error("The uri of extension is not exits");
        }
        if (this.extensionUri) {
            throw new Error("The uri of extension is already assignment");
        }
        this.extensionUri = uri;
    }

    /** 读取扩展uri */
    static get get (): Uri {
        if (!this.extensionUri) {
            throw new Error("The uri of extension has not be assignment");
        }
        return this.extensionUri;
    }

    /** 清除缓存的uri数据 */
    static clear () {
        this.extensionUri = null;
    }
}