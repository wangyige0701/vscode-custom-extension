import { window, WebviewViewProvider, Disposable, Uri, CancellationToken, WebviewView, WebviewViewResolveContext, Webview, version } from "vscode";
import { createBuffer, isFileExits, newUri, readDirectoryUri, readFileUri, readFileUriList, writeFileUri } from "../file";
import { getNonce } from "..";
import { errHandle } from "../../error";
import { MessageData, contextInter, fb, options, webFileType } from "./main";
import { backgroundExecute } from "../../backgroundImage/execute";
import { backgroundMessageData } from "../../backgroundImage/data";
import { bisectionAsce } from "../algorithm";
import { getVersion, isDev } from "../../version";
import { getWorkSpace, setWorkSpace } from "../../workspace";

const webFile: webFileType = {
    html: 'index.html',
    css: 'css',
    js: 'js'
}

/**
 * 当前版本号是否有变化，判断是否需要重新合并文件
 */
const isVersionSame = checkVersion();

// 判断是否需要更新版本信息
if (!isVersionSame) {
    refreshVersion();
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
            }).catch(err => {
                errHandle(err);
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

    /**
     * 读取指定路径下的文件，需要限制文件类型
     * @param uri
     * @param fileType 文件类型 
     * @returns 
     */
    private readDirectoryFile (uri: Uri, fileType: string): Promise<Uri[]> {
        return new Promise((resolve, reject) => {
            try {
                readDirectoryUri(newUri(uri)).then(res => {
                    const list: Uri[] = [];
                    res.forEach(item => {
                        if (item[1] === 1 && new RegExp(`\\.${fileType}$`).test(item[0])) 
                            list.push(newUri(uri, item[0]));
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
    private mergeAllFile (fileUri: Uri[]): Promise<string> {
        return new Promise((resolve, reject) => {
            readFileUriList(fileUri).then(res => {
                let list: string[] = [];
                const position: number[] = [];
                res.forEach((str: Uint8Array | string) => {
                    str = str.toString();
                    let index: number | RegExpMatchArray | null  = str.match(/\/\* index\((\d*)\) \*\//);
                    index = index ? parseFloat(index[1]) : 0;
                    // 二分插入定位
                    const posi = bisectionAsce(position, index);
                    position.splice(posi, 0, index);
                    list.splice(posi, 0, str);
                });
                resolve(list.join('\n\n'));
            }).catch(err => {
                reject(err);
            });
        });
    }

    /**
     * 检查是否需要重新合并文件
     * @param type 
     * @returns 
     */
    toReMergeFiles (type: 'css'|'js'): Promise<boolean> {
        return new Promise((resolve, reject) => {
            // 如果是开发环境直接返回true
            if (isDev()) {
                resolve(true);
                return;
            }
            // 如果vscode或者插件号版本号不同，直接返回true，允许合并
            if (!isVersionSame) {
                resolve(true);
                return;
            }
            // 如果对应uri为空，抛出错误
            if ((type === 'css' && !this.newCssUri) || (type === 'js' && !this.newJsUri)) {
                reject(new Error('File Uri undefinded'));
                return;
            }
            isFileExits(type === 'css' ? this.newCssUri! : this.newJsUri!)
                .then(res => {
                    if (res) {
                        // 文件存在，不需要合并
                        resolve(false);
                    } else {
                        resolve(true);
                    }
                }).catch(err => {
                    reject(err);
                });
        });
    }

    /**
     * 生成html字符串
     * @param webview 
     * @returns 
     */
    private setHtml (webview: Webview): Promise<string> {
        return new Promise((resolve, reject) => {
            const nonce = getNonce();
            // 查询指定html文件路径
            this.start().then(() => {
                // 将html文本内js和css替换为指定路径下的对应文件
                return this.toReMergeFiles('css');
            }).then(res => {
                if (res) 
                    return this.cssFileMerge(webview);
            }).then(() => {
                return this.toReMergeFiles('js');
            }).then(res => {
                if (res)
                    return this.jsFileMerge();
            }).then(() => {
                // html文本处理
                this.htmlContent = this.htmlContent
                    .replace(/(#policy)/, 
                        `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src ${webview.cspSource}; style-src ${
                        webview.cspSource}; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} https: data:;">`
                    )
                    .replace(/(#css)/, this.newCssUri?
                        `<link href="${webview.asWebviewUri(this.newCssUri)}" rel="stylesheet />`:
                        ''
                    )
                    .replace(/(#js)/, this.newJsUri?
                        `<script nonce="${nonce}" src="${webview.asWebviewUri(this.newJsUri)}"></script>`:
                        ''
                    );
            }).then(() => {
                resolve(this.htmlContent);
            }).catch(err => {
                reject(err);
            });
        });
    }

    /**
     * 合并css文件
     * @param webview 
     * @returns 
     */
    cssFileMerge (webview: Webview): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.cssUri) {
                let resetCss: fb, vscodeCss: fb;
                // 外部统一样式处理
                Promise.all([
                    readFileUri(this.resetCssUri!),
                    readFileUri(this.vscodeCssUri!)
                ]).then(([a, b]: [fb, fb]) => {
                    resetCss = a;
                    vscodeCss = b;
                    return this.readDirectoryFile(this.cssUri!, 'css');
                }).then(res => {
                    // 只能引入一个css文件，需要将其余引用样式写入主css文件中
                    return this.mergeAllFile(res);
                }).then(str => {
                    // css文件整合，icon引入路径修改
                    let css: Buffer = createBuffer(
                        resetCss.toString().replace(/(#iconfont)/g, `${webview.asWebviewUri(this.iconUri!)}`) + 
                        '\n' + vscodeCss.toString() + 
                        '\n' + str);
                    // 合并css文件
                    return writeFileUri(this.newCssUri!, css);
                }).then(() => {
                    resolve();
                }).catch(err => {
                    reject(err);
                });
            } else {
                resolve();
            }
        });
    }

    /**
     * 合并js文件
     * @returns 
     */
    jsFileMerge (): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.jsUri) {
                this.readDirectoryFile(this.jsUri, 'js').then(res => {
                    return this.mergeAllFile(res);
                }).then(str => {
                    let js: Buffer = createBuffer(
                        `(function () {${
                            '\n'+str+'\n'
                        }})();`
                    );
                    return writeFileUri(this.newJsUri!, js);
                }).then(() => {
                    resolve();
                }).catch(err => {
                    reject(err);
                });
            } else {
                resolve();
            }
        });
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

/**
 * 获取当前版本状态
 * @returns 
 */
function checkVersion (): boolean {
    const config = getWorkSpace("wangyige.webview");
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
function refreshVersion () {
    setWorkSpace("wangyige.webview", "VSCodeVersion", version)
        .then(() => {
            return setWorkSpace("wangyige.webview", "ExtensionVersion", getVersion());
        }, err => {
            errHandle(err);
        }).then(() => {}, err => {
            errHandle(err);
        });
}