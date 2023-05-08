import { window, WebviewViewProvider, Disposable, ExtensionContext, Uri, CancellationToken, WebviewView, WebviewViewResolveContext, Webview } from "vscode";
import { createBuffer, joinPathUri, newUri, readDirectoryUri, readFileUri, uriStat, writeFileUri } from "../file";
import { getHashCode, getNonce } from "..";

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
    private readonly baseUri?: Uri;
    private readonly title: string = '';
    private htmlContent: string = '';
    private cssUri?: Uri;
    private jsUri?: Uri;
    private vscodeCssUri?: Uri;
    private resetCssUri?: Uri;

    constructor (path: string, title:string = '') {
        if (!contextContainer.instance) return;
        this.baseUri = Uri.joinPath(contextContainer.instance.extensionUri, path);
        this.title = title;
        const publicFileUri = Uri.joinPath(contextContainer.instance.extensionUri, 'src', 'webview');
        this.vscodeCssUri = newUri(publicFileUri, 'vscode.css');
        this.resetCssUri = newUri(publicFileUri, 'reset.css');
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
            enableScripts: true, // 允许加载js脚本
            enableForms: true
        }
        webviewView.title = this.title;
        this.setHtml(webviewView.webview).then(html => {
            console.log(html);
            // html赋值
            webviewView.webview.html = html;
        });
    }

    private async setHtml (webview: Webview): Promise<string> {
        const nonce = getNonce();
        // 查询指定html文件路径
        await this.start().then(async () => {
            // 将html文本内js和css替换为指定路径下的对应文件
            // 只能引入一个css文件，需要将其余引用样式写入主css文件中
            let [resetCss, vscodeCss, css] = await Promise.all([
                readFileUri(this.resetCssUri!),
                readFileUri(this.vscodeCssUri!),
                readFileUri(this.cssUri!)
            ]);
            css = createBuffer(resetCss.toString() + '\n' + vscodeCss.toString() + '\n' + css.toString());
            writeFileUri(this.cssUri!, css);
            this.htmlContent = this.htmlContent
                .replace(/(#policy)/, 
                    `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} https:;`)
                .replace(/(#css)/, this.cssUri?
                    `<link href="${webview.asWebviewUri(this.cssUri!)}" rel="stylesheet />`:
                    '')
                .replace(/(#js)/, this.jsUri?
                    `<script nonce="${nonce}" src="${webview.asWebviewUri(this.jsUri!)}"></script>`:
                    '');
        });
        return Promise.resolve(this.htmlContent);
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