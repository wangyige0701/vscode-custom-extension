import { FileType, Uri, Webview} from "vscode";
import { createBuffer, newUri, readDirectoryUri, readFileUri, readFileUriList, writeFileUri } from "../file";
import { createExParamPromise, getNonce } from "..";
import { ExternalFile, contextInter, webFileType } from "./type";
import { isDev } from "../../version";
import { bisectionAsce } from '../algorithm';
import { checkVersion, refreshVersion } from "../../version/utils";
import { WError, promiseReject } from "../../error";
import { cryHex } from "../hash";

const webFile: webFileType = {
    html: 'index.html',
    css: 'css',
    js: 'js'
};

/** 当前版本号是否有变化，判断是否需要重新合并文件 */
const isVersionSame = checkVersion('webview');

// 判断是否需要更新版本信息
if (!isVersionSame) {
    refreshVersion('webview');
}

/** webview文件合并类 */
export class FileMerge {
    /** webview项目根路径 */
    public readonly baseUri?: Uri;
    /** 标题 */
    public readonly title: string = '';
    /** 最终生成的html文本 */
    private htmlContent: string = '';
    /** css文件夹 */
    private cssUri?: Uri;
    /** 合并后生成的css文件路径 */
    private newCssUri?: Uri;
    /** js文件夹 */
    private jsUri?: Uri;
    /** 合并后生成的js文件路径 */
    private newJsUri?: Uri;
    /** vscode webview外部公共css、js文件路径 */
    private externalFilesUri = {
        css: [] as Uri[],
        js: [] as Uri[]
    };
    /** webview文件根路径，用于获取公共文件 */
    private publicFileUri?:Uri;
    /** webview文件夹资源路径 */
    private mainUri?: Uri;
    /** 环境变量 */
    private env: 'development' | 'production' = 'development';
    /** 开发环境判断是否已经合并过文件 */
    private isMergeCompleteInDev = false;
    /** 判断注册的webview页面是否已经创建过，创建过的文件不需要再次合并css、js文件 */
    private static isFileMerged: Set<string>;

    constructor (path: string, title:string = '') {
        if (!contextContainer.instance) {
            return;
        }
        this.baseUri = Uri.joinPath(contextContainer.instance.extensionUri, path);
        this.title = title;
        if (isDev()) {
            // 开发环境
            this.env = 'development';
            // 开发环境下创建set
            if (!FileMerge.isFileMerged) {
                FileMerge.isFileMerged = new Set();
            }
            // 判断文件是否合并过
            const pathHash = cryHex(path);
            if (FileMerge.isFileMerged.has(pathHash)) {
                this.isMergeCompleteInDev = true;
            } else {
                FileMerge.isFileMerged.add(pathHash);
            }
        } else {
            this.env = 'production';
        }
        this.publicFileUri = Uri.joinPath(contextContainer.instance.extensionUri, 'webview');
        // 生产环境合成index.production.js/css，开发环境合成index.development.js/css
        this.newCssUri = newUri(this.baseUri!, `index.${this.env}.css`);
        this.newJsUri = newUri(this.baseUri!, `index.${this.env}.js`);
        this.mainUri = this.publicFileUri;
    }

    /**
     * 生成html字符串
     * @param webview webview实例
     */
    setHtml (webview: Webview): Promise<string> {
        return new Promise((resolve, reject) => {
            this.envHandle(webview, this.env === 'development').then(() => {
                const nonce = getNonce();
                // html文本处理
                this.htmlContent = this.htmlContent
                .replace(/(#policy)/, 
                    `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src ${webview.cspSource}; style-src ${
                    webview.cspSource}; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} https: data: blob:;">`
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
                reject(promiseReject(err, 'setHtml', 'FileMerge'));
            });
        });
    }

    /**
     * 读取html文本，获取css和js文件路径
     * @param dev 是否是开发环境
     */
    private async start (dev: boolean) {
        await readDirectoryUri(this.publicFileUri!).then(res => {
            // 整理所有外部公共文件的Uri，开发环境下需要整合公共文件
            if (dev && !this.isMergeCompleteInDev) {
                const external_files: ExternalFile[] = ['css', 'js'];
                // 过滤外部公用文件的文件夹
                const external_files_get: Promise<[[ExternalFile, FileType][], ExternalFile]>[] = res.filter(([name, type]) => {
                    return type === 2 && external_files.includes(name as ExternalFile);
                }).map(([name]) => {
                    return createExParamPromise(readDirectoryUri(newUri(this.publicFileUri!, name)), name) as Promise<[[ExternalFile, FileType][], ExternalFile]>;
                });
                return Promise.all(external_files_get);
            }
        }).then(datas => {
            if (datas) {
                for (const data of datas) {
                    const [files, name] = data;
                    for (const [filename] of files) {
                        if (!(name in this.externalFilesUri)) {
                            continue;
                        }
                        if (!filename.endsWith(name)) {
                            continue;
                        }
                        this.externalFilesUri[name].push(newUri(this.publicFileUri!, name, filename));
                    }
                }
            }
            return readDirectoryUri(this.baseUri!);
        }).then(async (res) => {
            for (const name in webFile) {
                if (!res.find(item => item[0] === webFile[name])) {
                    continue;
                }
                const searchUri = newUri(this.baseUri!, webFile[name]);
                if (name === 'html') {
                    // 获取html文本内容
                    await readFileUri(searchUri!).then((val: Uint8Array) => {
                        this.htmlContent = val.toString();
                    }).catch(err => {
                        throw new WError('Read File Error', {
                            cause: err,
                            position: 'Function',
                            ClassName: 'FileMerge',
                            FunctionName: 'start > readDirectoryUri > readFileUri'
                        });
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
            return Promise.resolve();
        }).catch(err => {
            return Promise.reject(promiseReject(err, 'start', 'FileMerge'));
        });
    }

    /**
     * 根据环境执行不同html文本获取函数
     * @param webview webview实例
     * @param dev 是否是开发环境
     */
    private envHandle (webview: Webview, dev: boolean): Promise<void> {
        if (dev) {
            // 开发环境
            return this.development(webview, dev);
        } else {
            return this.production(webview, dev);
        }
    }

    /**
     * 生产环境读取文本
     * @param webview webview实例
     * @param dev 是否是开发环境
     */
    private production (webview: Webview, dev: boolean): Promise<void> {
        return new Promise((resolve, reject) => {
            this.start(dev).then(() => {
                return this.refreshCssIconfont(webview);
            }).then(() => {
                resolve();
            }).catch(err => {
                reject(promiseReject(err, 'production', 'FileMerge'));
            });
        });
    }

    /** 根据版本判断是否需要更新css文件内的icon图标路径 */
    private refreshCssIconfont (webview: Webview): Promise<void> {
        return new Promise((resolve, reject) => {
            if (isVersionSame) {
                // 版本相同，不需要更新
                return resolve();
            }
            readFileUri(this.newCssUri!).then((css: Uint8Array) => {
                return Promise.resolve(this.cssIconfontPath(css.toString(), webview));
            }).then(css => {
                return writeFileUri(this.newCssUri!, createBuffer(css));
            }).then(() => {
                resolve();
            }).catch(err => {
                reject(promiseReject(err, 'refreshCssIconfont', 'FileMerge'));
            });
        });
    }

    /**
     * 开发环境读取文本
     * @param webview webview实例
     * @param dev 是否是开发环境
     */
    private development (webview: Webview, dev: boolean): Promise<void> {
        return new Promise((resolve, reject) => {
            // 查询指定html文件路径
            this.start(dev).then(() => {
                // 将html文本内js和css替换为指定路径下的对应文件
                if (!this.isMergeCompleteInDev) {
                    return this.cssFileMerge(webview);
                }
            }).then(() => {
                if (!this.isMergeCompleteInDev) {
                    return this.jsFileMerge();
                }
            }).then(() => {
                resolve();
            }).catch(err => {
                reject(promiseReject(err, 'development', 'FileMerge'));
            });
        });
    }

    /**
     * 开发环境读取指定路径下的文件，需要限制文件类型
     * @param uri
     * @param fileType 文件类型 
     */
    private readDirectoryFile (uri: Uri, fileType: string): Promise<Uri[]> {
        return new Promise((resolve, reject) => {
            readDirectoryUri(newUri(uri)).then(res => {
                const list: Uri[] = [], checkReg = new RegExp(`\\.${fileType}$`);
                for (const item of res) {
                    if (item[1] === 1 && checkReg.test(item[0])) {
                        list.push(newUri(uri, item[0]));
                    }
                }
                resolve(list);
            }).catch(err => {
                reject(promiseReject(err, 'readDirectoryFile', 'FileMerge'));
            });
        });
    }

    /**
     * 开发环境下将不同文件内容根据顺序合并
     * @param fileUri 需要合并的文件数组
     */
    private mergeAllFile (fileUri: Uri[]): Promise<string> {
        return new Promise((resolve, reject) => {
            if (fileUri.length <= 0) {
                return resolve('');
            }
            readFileUriList(fileUri).then(res => {
                resolve(mergeWebviewFile(res));
            }).catch(err => {
                reject(promiseReject(err, 'mergeAllFile', 'FileMerge'));
            });
        });
    }

    /** 开发环境合并css文件 */
    private cssFileMerge (webview: Webview): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.cssUri) {
                return resolve();
            }
            // 外部统一样式处理
            this.externalFileMerge('css').then(res => {
                return createExParamPromise(this.readDirectoryFile(this.cssUri!, 'css'), res);
            }).then(([res, external_css_content]) => {
                // 只能引入一个css文件，需要将其余引用样式写入主css文件中
                return createExParamPromise(this.mergeAllFile(res), external_css_content);
            }).then(([str, external_css_content]) => {
                // css文件整合，icon引入路径修改
                let css: string = this.cssIconfontPath(external_css_content, webview) + '\n' + str;
                return Promise.resolve(css);
            }).then(css => {
                // 合并css文件
                return writeFileUri(this.newCssUri!, createBuffer(css));
            }).then(() => {
                resolve();
            }).catch(err => {
                reject(promiseReject(err, 'cssFileMerge', 'FileMerge'));
            });
        });
    }

    /** 将css文件中的iconfont引入路径进行替换 */
    private cssIconfontPath (css: string, webview: Webview): string {
        return css.replace(/(#iconfont)/g, this.mainUri ? webview.asWebviewUri(this.mainUri).toString() : '../..');
    }

    /** 开发环境合并js文件 */
    private jsFileMerge (): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.jsUri) {
                return resolve();
            }
            this.externalFileMerge('js').then(res => {
                return createExParamPromise(this.readDirectoryFile(this.jsUri!, 'js'), res);
            }).then(([res, externale_js_content]) => {
                return createExParamPromise(this.mergeAllFile(res), externale_js_content);
            }).then(([str, externale_js_content]) => {
                let js: string = `(function () {${'\n'+externale_js_content + '\n' + str+'\n'}})();`;
                return Promise.resolve(js);
            }).then(js => {
                return writeFileUri(this.newJsUri!, createBuffer(js));
            }).then(() => {
                resolve();
            }).catch(err => {
                reject(promiseReject(err, 'jsFileMerge', 'FileMerge'));
            });
        });
    }

    /** 合并外部文件内容 */
    private externalFileMerge (type: 'css'|'js'): Promise<string> {
        return new Promise((resolve, reject) => {
            this.mergeAllFile(this.externalFilesUri[type]).then(res => {
                resolve(res);
            }).catch(err => {
                reject(promiseReject(err, 'externalFileMerge', 'FileMerge'));
            });
        });
    }
}

/** 保存context数据 */
export const contextContainer: contextInter = {
    instance: void 0
};

/**
 * 将不同文件下的Uint8Array数据转为字符串，按序合并返回
 * @param data 需要被转换的数据
 */
export function mergeWebviewFile (data: string[] | Uint8Array[]): string {
    let list: string[] = [];
    const position: number[] = [];
    data.forEach((str: Uint8Array | string) => {
        if (str instanceof Uint8Array) {
            str = str.toString();
        }
        let index: number | RegExpMatchArray | null  = str.match(/\/\* index\((\d*)\) \*\//);
        index = index ? parseFloat(index[1]) : 0;
        // 二分插入定位
        const posi = bisectionAsce(position, index);
        position.splice(posi, 0, index);
        list.splice(posi, 0, str);
    });
    return list.join('\n\n');
}