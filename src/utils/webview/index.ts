/**
 * 对html引用的css和js进行合并的操作，在正式环境需要进行判断，即vscode、插件版本号和缓存不同时进行处理，
 * 如果路径下文件不存在，则直接合并
 * 保存文件的路径需要添加自定义选项
 * 修改自定义路径时提示是否删除旧路径下的数据
 */

import { window, WebviewViewProvider, Disposable, Uri, CancellationToken, WebviewView, WebviewViewResolveContext, Webview } from "vscode";
import { createBuffer, newUri, readDirectoryUri, readFileUri, readFileUriList, writeFileUri } from "../file";
import { getNonce } from "..";
import { errHandle } from "../../error";
import { MessageData, contextInter, options, webFileType } from "./main";
import { backgroundExecute } from "../../backgroundImage/execute";
import { backgroundMessageData } from "../../backgroundImage/data";

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
    private newCssUri?: Uri; // 合并后生成的css文件路径
    private jsUri?: Uri; // js文件夹
    private newJsUri?: Uri; // 合并后生成的js文件路径
    private vscodeCssUri?: Uri; // vscode webview标签样式css文件路径
    private resetCssUri?: Uri; // 重置样式文件路径
    private iconUri?: Uri; // 图标资源路径

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
            errHandle(error);
        }
    }

    /**
     * 读取html文本，获取css和js文件路径
     * @returns 
     */
    async start () {
        await readDirectoryUri(this.baseUri!).then(async (res) => {
            for (let name in webFile) {
                if (!res.find(item => item[0] === webFile[name])) continue;
                const searchUri = newUri(this.baseUri!, webFile[name]);
                if (name === 'html') {
                    // 获取html文本内容
                    await readFileUri(searchUri!).then((res: Uint8Array) => {
                        this.htmlContent = res.toString();
                    }).catch(err => {
                        throw err;
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

    private readDirectoryFile (uri: Uri): Promise<Uri[]> {
        return new Promise((resolve, reject) => {
            try {
                readDirectoryUri(newUri(uri)).then(res => {
                    const list: Uri[] = [];
                    res.forEach(item => {
                        if (item[1] === 1) list.push(newUri(uri, item[0]));
                    });
                    resolve(list);
                }).catch(err => {
                    throw err;
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
                            let i = start + l, n = array[i];
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
                    writeFileUri(this.newCssUri!, css).catch(err => {
                        throw err;
                    });
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
                    writeFileUri(this.newJsUri!, js).catch(err => {
                        throw err;
                    });
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
                .replace(/(#js)/, this.newJsUri?
                    `<script nonce="${nonce}" src="${webview.asWebviewUri(this.newJsUri)}"></script>`:
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
                backgroundExecute(<backgroundMessageData>{ 
                    name: message.name, 
                    value: message.value 
                }, webview);
                break;
            default:
                break;
        }
    });
}

/**
 * webview端发送通信信息
*/
export function messageSend (webview: Webview, options: MessageData): void {
    if (webview) {
        try {
            webview.postMessage(options);
        } catch (error) {
            errHandle(error);
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