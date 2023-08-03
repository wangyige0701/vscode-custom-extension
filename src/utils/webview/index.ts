import { Uri, Webview} from "vscode";
import { createBuffer, newUri, readDirectoryUri, readFileUri, readFileUriList, writeFileUri } from "../file";
import { getNonce } from "..";
import { contextInter, webFileType, fb } from "./main";
import { isDev } from "../../version";
import { bisectionAsce } from '../algorithm';
import { checkVersion, refreshVersion } from "../../version/utils";

const webFile: webFileType = {
    html: 'index.html',
    css: 'css',
    js: 'js'
}

/**
 * 当前版本号是否有变化，判断是否需要重新合并文件
 */
const isVersionSame = checkVersion('webview');

// 判断是否需要更新版本信息
if (!isVersionSame) {
    refreshVersion('webview');
}

/** webview文件合并类 */
export class FileMerge {
    public readonly baseUri?: Uri;
    public readonly title: string = '';
    private htmlContent: string = '';
    private cssUri?: Uri; // css文件夹
    private newCssUri?: Uri; // 合并后生成的css文件路径
    private jsUri?: Uri; // js文件夹
    private newJsUri?: Uri; // 合并后生成的js文件路径
    private vscodeCssUri?: Uri; // vscode webview标签样式css文件路径
    private resetCssUri?: Uri; // 重置样式文件路径
    private iconUri?: Uri; // 图标资源路径
    private env: 'development' | 'production' = 'development';

    constructor (path: string, title:string = '') {
        if (!contextContainer.instance) return;
        this.baseUri = Uri.joinPath(contextContainer.instance.extensionUri, path);
        this.title = title;
        if (isDev()) {
            // 开发环境
            this.env = 'development';
        } else {
            this.env = 'production';
        }
        const publicFileUri = Uri.joinPath(contextContainer.instance.extensionUri, 'webview');
        this.vscodeCssUri = newUri(publicFileUri, 'vscode.css');
        this.resetCssUri = newUri(publicFileUri, 'reset.css');
        // 生产环境合成index.production.js/css，开发环境合成index.development.js/css
        this.newCssUri = newUri(this.baseUri!, `index.${this.env}.css`);
        this.newJsUri = newUri(this.baseUri!, `index.${this.env}.js`);
        this.iconUri = publicFileUri;
    }

    /**
     * 生成html字符串
     * @param webview 
     * @returns 
     */
    setHtml (webview: Webview): Promise<string> {
        return new Promise((resolve, reject) => {
            this.envHandle(webview, this.env === 'development').then(() => {
                const nonce = getNonce();
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
     * 根据环境执行不同html文本获取函数
     */
    private envHandle (webview: Webview, dev: boolean): Promise<void> {
        if (this.env === 'development') {
            // 开发环境
            return this.development(webview, dev);
        } else {
            return this.production(webview, dev);
        }
    }

    /**
     * 生产环境读取文本
     */
    private production (webview: Webview, dev: boolean): Promise<void> {
        return new Promise((resolve, reject) => {
            this.start(dev).then(() => {
                return this.refreshCssIconfont(webview);
            }).then(() => {
                resolve();
            }).catch(err => {
                reject(err);
            });
        });
    }

    /**
     * 根据版本判断是否需要更新css文件内的icon图标路径
     */
    private refreshCssIconfont (webview: Webview): Promise<void> {
        return new Promise((resolve, reject) => {
            if (isVersionSame) {
                // 版本相同，不需要更新
                resolve();
            } else {
                readFileUri(this.newCssUri!).then((css: Uint8Array) => {
                    return Promise.resolve(this.cssIconfontPath(css.toString(), webview));
                }).then(css => {
                    return writeFileUri(this.newCssUri!, createBuffer(css));
                }).then(() => {
                    resolve();
                }).catch(err => {
                    reject(err);
                })
            }
        });
    }

    /**
     * 开发环境读取文本
    */
    private development (webview: Webview, dev: boolean): Promise<void> {
        return new Promise((resolve, reject) => {
            // 查询指定html文件路径
            this.start(dev).then(() => {
                // 将html文本内js和css替换为指定路径下的对应文件
                return this.cssFileMerge(webview);
            }).then(() => {
                return this.jsFileMerge();
            }).then(() => {
                resolve();
            }).catch(err => {
                reject(err);
            });
        });
    }

    /**
     * 读取html文本，获取css和js文件路径
     */
    private async start (dev: boolean) {
        await readDirectoryUri(this.baseUri!).then(async (res) => {
            for (let name in webFile) {
                if (!res.find(item => item[0] === webFile[name])) continue;
                const searchUri = newUri(this.baseUri!, webFile[name]);
                if (name === 'html') {
                    // 获取html文本内容
                    await readFileUri(searchUri!).then((res: Uint8Array) => {
                        this.htmlContent = res.toString();
                    }).catch(err => {
                        return Promise.reject(err);
                    });
                } else if (!dev) {
                    // 生产环境只解析html
                    continue;
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
     * 开发环境读取指定路径下的文件，需要限制文件类型
     * @param uri
     * @param fileType 文件类型 
     * @returns 
     */
    private readDirectoryFile (uri: Uri, fileType: string): Promise<Uri[]> {
        return new Promise((resolve, reject) => {
            try {
                readDirectoryUri(newUri(uri)).then(res => {
                    const list: Uri[] = [], checkReg = new RegExp(`\\.${fileType}$`);
                    res.forEach(item => {
                        if (item[1] === 1 && checkReg.test(item[0])) 
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
     * 开发环境下将不同文件内容根据顺序合并
     * @param fileUri 
     * @returns 
     */
    private mergeAllFile (fileUri: Uri[]): Promise<string> {
        return new Promise((resolve, reject) => {
            readFileUriList(fileUri).then(res => {
                resolve(mergeWebviewFile(res));
            }).catch(err => {
                reject(err);
            });
        });
    }

    /**
     * 开发环境合并css文件
     */
    private cssFileMerge (webview: Webview): Promise<void> {
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
                    let css: string = this.cssIconfontPath(resetCss.toString(), webview) + 
                        '\n' + vscodeCss.toString() + 
                        '\n' + str;
                    return Promise.resolve(css);
                }).then((css: string | Buffer) => {
                    css = createBuffer(css);
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
     * 将css文件中的iconfont引入路径进行替换
     */
    private cssIconfontPath (css: string, webview: Webview) {
        return css.replace(/(#iconfont)/g, `${webview.asWebviewUri(this.iconUri!)}`)
    }

    /**
     * 开发环境合并js文件
     */
    private jsFileMerge (): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.jsUri) {
                this.readDirectoryFile(this.jsUri, 'js').then(res => {
                    return this.mergeAllFile(res);
                }).then(str => {
                    let js: string = `(function () {${'\n'+str+'\n'}})();`;
                    return Promise.resolve(js);
                }).then((js: string | Buffer) => {
                    js = createBuffer(js);
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

/** 保存context数据 */
export const contextContainer: contextInter = {
    instance: undefined
}

/**
 * 将不同文件下的Uint8Array数据转为字符串，按序合并返回
 * @param data 
 * @returns 
 */
export function mergeWebviewFile (data: string[] | Uint8Array[]): string {
    let list: string[] = [];
    const position: number[] = [];
    data.forEach((str: Uint8Array | string) => {
        if (str instanceof Uint8Array) 
            str = str.toString();
        let index: number | RegExpMatchArray | null  = str.match(/\/\* index\((\d*)\) \*\//);
        index = index ? parseFloat(index[1]) : 0;
        // 二分插入定位
        const posi = bisectionAsce(position, index);
        position.splice(posi, 0, index);
        list.splice(posi, 0, str);
    });
    return list.join('\n\n');
}