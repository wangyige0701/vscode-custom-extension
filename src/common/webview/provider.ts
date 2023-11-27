import type { ExtensionContext, Disposable, CancellationToken, WebviewView, WebviewViewProvider, WebviewViewResolveContext } from "vscode";
import type { RegistWebviewProviderOptions } from "./types";
import { window } from "vscode";
import { errlog } from "../../error";
import { messageHandle, FileMerge } from ".";

/** 通过html文件插入webview */
export class webviewCreateProvider implements WebviewViewProvider {
    private newFile: FileMerge | null;
    private callback?: (e: void) => any;

    constructor (path: string, title:string = '', visibleHiddenCallback?: (e: void) => any) {
        // 获取合并文件的实例
        this.newFile = new FileMerge(path, title);
        this.callback = visibleHiddenCallback;
    }

    resolveWebviewView(webviewView: WebviewView, context: WebviewViewResolveContext<unknown>, token: CancellationToken): void | Thenable<void> {
        try {
            webviewView.webview.options = {
                enableCommandUris: true,
                enableScripts: true, // 允许加载js脚本
                enableForms: true
            };
            webviewView.title = this.newFile!.title;
            if (this.callback) {
                webviewView.onDidChangeVisibility(() => {
                    if (!webviewView.visible) {
                        this.callback?.();
                    }
                });
            }
            // 生成html文本
            this.newFile!.setHtml(webviewView.webview).then(html => {
                // html赋值
                webviewView.webview.html = html;
            }).catch(err => {
                errlog(err);
            }).finally(() => {
                this.newFile = null;
            });
            messageHandle(webviewView.webview);
        } catch (error) {
            errlog(error);
        }
    }
}

/** 注册webview provider */
export function registWebviewProvider (
    subscriptions: ExtensionContext["subscriptions"],
    viewId: string, 
    provider: { path: string, title: string }, 
    { retainContextWhenHidden = false, visibleHiddenCallback = void 0 }: RegistWebviewProviderOptions
): Disposable {
    const dispose = window.registerWebviewViewProvider(
        viewId, 
        new webviewCreateProvider(provider.path, provider.title, visibleHiddenCallback), 
        {
            webviewOptions: { retainContextWhenHidden }
        }
    );
    subscriptions.push(dispose);
    return dispose;
}