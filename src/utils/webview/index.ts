import { window, WebviewViewProvider, Disposable, ExtensionContext, Uri, CancellationToken, WebviewView, WebviewViewResolveContext, Webview } from "vscode";
import { createBuffer, newUri, readDirectoryUri, readFileUri, readFileUriList, writeFileUri } from "../file";
import { getNonce } from "..";
import { errHandle } from "../../error";
import { MessageData } from "./main";
import { backgroundExecute } from "../../backgroundImage/execute";

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
    css: 'css',
    js: 'js'
}

/**
 * 通过html文件插入webview
 */
export class webviewCreateByHtml implements WebviewViewProvider {
    private readonly baseUri?: Uri;
    private readonly title: string = '';
    private htmlContent: string = '';
    private cssUri?: Uri; // css文件夹
    private newCssUri?: Uri;
    private jsUri?: Uri; // js文件夹
    private newJsUri?: Uri;
    private vscodeCssUri?: Uri;
    private resetCssUri?: Uri;
    private iconUri?: Uri;

    constructor (path: string, title:string = '') {
        if (!contextContainer.instance) return;
        this.baseUri = Uri.joinPath(contextContainer.instance.extensionUri, path);
        this.title = title;
        const publicFileUri = Uri.joinPath(contextContainer.instance.extensionUri, 'src', 'webview');
        this.vscodeCssUri = newUri(publicFileUri, 'vscode.css');
        this.resetCssUri = newUri(publicFileUri, 'reset.css');
        this.newCssUri = newUri(this.baseUri!, 'index.css');
        this.newJsUri = newUri(this.baseUri!, 'index.js');
        this.iconUri = publicFileUri;
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
        try {
            webviewView.webview.options = {
                enableCommandUris: true,
                enableScripts: true, // 允许加载js脚本
                enableForms: true
            }
            webviewView.title = this.title;
            this.setHtml(webviewView.webview).then(html => {
                // html赋值
                webviewView.webview.html = html;
            });
            messageHandle(webviewView.webview);
        } catch (error) {
            errHandle(error as Error);
        }
    }

    private readDirectoryFile (uri: Uri): Promise<Uri[]> {
        return new Promise((resolve, reject) => {
            try {
                readDirectoryUri(newUri(uri)).then(res => {
                    const list: Uri[] = [];
                    res.forEach(item => {
                        if (item[1] === 1) list.push(newUri(uri, item[0]));
                    });
                    resolve(list);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * 将不同文件内容根据顺序合并
     * @param fileUri 
     * @returns 
     */
    private concatAllFile (fileUri: Uri[]): Promise<string> {
        return new Promise((resolve, reject) => {
            readFileUriList(fileUri).then(res => {
                let list: string[] = [];
                const position: number[] = [];
                res.forEach((str: Uint8Array | string) => {
                    str = str.toString();
                    let index: number | RegExpMatchArray | null  = str.match(/\/\* index\((\d*)\) \*\//);
                    index = index ? parseFloat(index[1]) : 0;

                    // 二分法排序
                    if (list.length === 0 || index >= position[position.length-1]) {
                        list.push(str);
                        position.push(index);
                    } else if (index <=  position[0]) {
                        list.unshift(str);
                        position.unshift(index);
                    } else {
                        let length = position.length;
                        function handle (length: number, array: number[], target: number, start: number = 0): number {
                            let l = length / 2;
                            if (length % 2 > 0) l--;
                            let i = start + l;
                            let n = array[i];
                            if (length === 3 || length === 2) return n > target ? i : i+1;
                            if (target >= n) {
                                return handle(array.length-i, array, target, i);
                            } else {
                                return handle(i+1, array, target, start);
                            }
                        }
                        let res = handle(length, position, index);
                        list.splice(res, 0, str);
                        position.splice(res, 0, index);
                    }
                });
                resolve(list.join('\n\n'));
            }).catch(err => {
                reject(err);
            });
        })
    }

    /**
     * 生成html字符串
     * @param webview 
     * @returns 
     */
    private async setHtml (webview: Webview): Promise<string> {
        const nonce = getNonce();
        type fb = Buffer | string | Uint8Array;
        // 查询指定html文件路径
        await this.start().then(async () => {
            // 将html文本内js和css替换为指定路径下的对应文件
            if (this.cssUri) {
                // 外部统一样式处理
                let [resetCss, vscodeCss]: [fb, fb] = await Promise.all([
                    readFileUri(this.resetCssUri!),
                    readFileUri(this.vscodeCssUri!)
                ]);
                // 只能引入一个css文件，需要将其余引用样式写入主css文件中
                await this.readDirectoryFile(this.cssUri).then(res => {
                    return this.concatAllFile(res);
                }).then(str => {
                    // css文件整合，icon引入路径修改
                    let css: Buffer = createBuffer(
                        resetCss.toString().replace(/(#iconfont)/g, `${webview.asWebviewUri(this.iconUri!)}`) + 
                        '\n' + vscodeCss.toString() + 
                        '\n' + str);
                    // 合并css文件
                    writeFileUri(this.newCssUri!, css);
                }).catch(err => {
                    throw err;
                });
            }
            if (this.jsUri) {
                await this.readDirectoryFile(this.jsUri).then(res => {
                    return this.concatAllFile(res);
                }).then(str => {
                    let js: Buffer = createBuffer(
                        `(function () {${
                            '\n'+str+'\n'
                        }})();`
                    );
                    writeFileUri(this.newJsUri!, js);
                }).catch(err => {
                    throw err;
                });
            }
            // html文本处理
            this.htmlContent = this.htmlContent
                .replace(/(#policy)/, 
                    `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src ${webview.cspSource}; style-src ${
                        webview.cspSource}; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} https: data:;">`
                    )
                .replace(/(#css)/, this.newCssUri?
                    `<link href="${webview.asWebviewUri(this.newCssUri)}" rel="stylesheet />`:
                    '')
                .replace(/(#js)/, this.jsUri?
                    `<script nonce="${nonce}" src="${webview.asWebviewUri(this.jsUri)}"></script>`:
                    '');
        });
        return Promise.resolve(this.htmlContent);
    }
}

/**
 * webview侧通信事件接收
 */
function messageHandle (webview: Webview) {
    webview.onDidReceiveMessage((message: MessageData) => {
        switch (message.group) {
            case 'background':
                // 背景图数据处理
                backgroundExecute(message.name, message.value, messageSend, webview);
                break;
            default:
                break;
        }
    });
}

/**
 * webview端发送通信信息
*/
function messageSend (webview: Webview, options: MessageData): void {
    if (webview) {
        try {
            webview.postMessage(options);
        } catch (error) {
            errHandle(error as Error);
        }
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