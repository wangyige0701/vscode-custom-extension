import type { Webview } from "vscode";

/**
 * 获取指定webview实例
 */
export default class WebviewInstance {
    private instance: Webview | undefined;

    constructor () {}

    get value (): Webview {
        if (!this.instance) {
            throw new Error("The instance of Webview is not assignment");
        }
        return this.instance;
    }

    set (value: Webview) {
        this.instance = value;
    }
}