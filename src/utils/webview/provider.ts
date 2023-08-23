import { 
    window, 
    WebviewViewProvider, 
    Disposable, 
    CancellationToken, 
    WebviewView, 
    WebviewViewResolveContext 
} from "vscode";
import { errlog } from "../../error";
import { options } from "./type";
import { messageHandle } from "./message";
import { FileMerge, contextContainer } from './index'

/** 通过html文件插入webview */
export class webviewCreateProvider implements WebviewViewProvider {
    private newFile: FileMerge | null;

    constructor (path: string, title:string = '') {
        // 获取合并文件的实例
        this.newFile = new FileMerge(path, title);
    }

    resolveWebviewView(webviewView: WebviewView, context: WebviewViewResolveContext<unknown>, token: CancellationToken): void | Thenable<void> {
        try {
            webviewView.webview.options = {
                enableCommandUris: true,
                enableScripts: true, // 允许加载js脚本
                enableForms: true
            }
            webviewView.title = this.newFile!.title;
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
export function registWebviewProvider (viewId: string, provider: { path: string, title: string }, options?: options | undefined): Disposable {
    const dispose = window.registerWebviewViewProvider(viewId, new webviewCreateProvider(provider.path, provider.title), options);
    contextContainer.instance!.subscriptions.push(dispose);
    return dispose;
}