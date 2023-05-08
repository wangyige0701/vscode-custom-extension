import { window, WebviewViewProvider, Disposable, ExtensionContext, Uri, CancellationToken, WebviewView, WebviewViewResolveContext } from "vscode";
import { joinPathUri, newUri, readDirectoryUri, readFileUri, uriStat } from "../file";

interface options {
    readonly webviewOptions?: {
        readonly retainContextWhenHidden?: boolean;
    } | undefined;
}

interface contextInter {
    [instance: string]: ExtensionContext | undefined;
}

interface webFileType {
    [key: string]: string;
}

const webFile: webFileType = {
    html: 'index.html',
    css: 'style.css',
    js: 'index.js'
}

/**
 * 通过html文件插入webview
 */
export class webviewCreateByHtml implements WebviewViewProvider {
    private readonly baseUri: Uri | undefined;
    private htmlContent: string = '';
    private cssUri: Uri | undefined;
    private jsUri: Uri | undefined;

    constructor (path: string) {
        if (!contextContainer.instance) return;
        this.baseUri = Uri.joinPath(contextContainer.instance.extensionUri, path);
    }

    async start () {
        await readDirectoryUri(this.baseUri!).then(async (res) => {
            for (let name in webFile) {
                if (!res.find(item => item[0] === webFile[name])) continue;
                const searchUri = newUri(this.baseUri!, webFile[name]);
                if (name === 'html') {
                    // 获取html文本内容
                    await readFileUri(searchUri!).then((res: Uint8Array) => {
                        this.htmlContent = res.toString();
                    });
                } else if (name === 'css') {
                    this.cssUri = searchUri;
                } else if (name === 'js') {
                    this.jsUri = searchUri;
                }
            }
        });
        return Promise.resolve();
    }

    resolveWebviewView(webviewView: WebviewView, context: WebviewViewResolveContext<unknown>, token: CancellationToken): void | Thenable<void> {
        webviewView.webview.options = {
            enableCommandUris: true,
            // 允许加载js脚本
            enableScripts: true
        }
        // 查询指定html文件路径
        this.start().then(() => {
            // 将html文本内js和css替换为指定路径下的对应文件
            this.htmlContent = this.htmlContent
                .replace(/(#css)/, this.cssUri?`<link href="${webviewView.webview.asWebviewUri(this.cssUri!)}" rel="stylesheet />`:'')
                .replace(/(#js)/, this.jsUri?`<script type="text/javascript" src="${webviewView.webview.asWebviewUri(this.jsUri!)}"></script>`:'');

            console.log(this.htmlContent);
            
            webviewView.webview.html = this.htmlContent;
        });
    }
}

/**
 * 注册webview
 */
export function registWebview (viewId: string, provider: WebviewViewProvider, options?: options | undefined): Disposable {
    return window.registerWebviewViewProvider(viewId, provider, options);
}

// 保存context数据
export const contextContainer: contextInter = {
    instance: undefined
}