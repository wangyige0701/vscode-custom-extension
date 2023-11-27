import type { Webview } from "vscode";
import type { ExternalFile, webFileType } from "../types";
import { FileType, Uri} from "vscode";
import { createBuffer, newUri, readDirectoryUri, readFileUri, readFileUriList, writeFileUri } from "../../file";
import { createExParamPromise, getNonce, bisectionAsce, cryHex } from "../../../utils";
import { isDev, checkVersion, refreshVersion  } from "../../../version";
import { WError, $rej } from "../../../error";
import { ExtensionUri } from "../../system";

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
    /** 判断是否已经合并过文件 */
    private isMergeComplete = false;
    /** 判断注册的webview页面是否已经创建过，创建过的文件不需要再次合并css、js文件 */
    private static isFileMerged: Set<string>;

    constructor (path: string, title:string = '') {
        this.baseUri = Uri.joinPath(ExtensionUri.get, path);
        this.title = title;
        if (isDev()) {
            // 开发环境
            this.env = 'development';
        } else {
            this.env = 'production';
        }
        // 创建文件合并判断set
        if (!FileMerge.isFileMerged) {
            FileMerge.isFileMerged = new Set();
        }
        // 判断文件是否合并过
        const pathHash = cryHex(path);
        if (FileMerge.isFileMerged.has(pathHash)) {
            this.isMergeComplete = true;
        } else {
            FileMerge.isFileMerged.add(pathHash);
        }
        // webview文件夹路径
        this.publicFileUri = Uri.joinPath(ExtensionUri.get, 'webview');
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
                reject($rej(err, this.setHtml.name, FileMerge.name));
            });
        });
    }

    /**
     * 读取html文本，获取css和js文件路径
     * @param dev 是否是开发环境
     */
    private async start (dev: boolean) {
        await Promise.resolve(
            // 整理所有外部公共文件的Uri，开发环境下需要整合公共文件，已经整合过不会再执行
            (dev && !this.isMergeComplete) ? readDirectoryUri(newUri(this.publicFileUri!, 'common')) : void 0
        ).then(res => {
            if (res) {
                const external_files: ExternalFile[] = ['css', 'js'];
                // 过滤外部公用文件的文件夹
                const external_files_get: Promise<[[ExternalFile, FileType][], ExternalFile]>[] = res.filter(([name, type]) => {
                    return type === FileType.Directory && external_files.includes(name as ExternalFile);
                }).map(([name]) => {
                    return createExParamPromise(readDirectoryUri(newUri(this.publicFileUri!, 'common', name)), name) as Promise<[[ExternalFile, FileType][], ExternalFile]>;
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
                        this.externalFilesUri[name].push(newUri(this.publicFileUri!, 'common', name, filename));
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
                            ClassName: FileMerge.name,
                            FunctionName: `${this.start.name} > ${readDirectoryUri.name} > ${readFileUri.name}`
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
            return Promise.reject($rej(err, this.start.name, FileMerge.name));
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
            // 生产环境
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
                if (!this.isMergeComplete) {
                    return this.refreshCssIconfont(webview);
                }
            }).then(() => {
                resolve();
            }).catch(err => {
                reject($rej(err, this.production.name, FileMerge.name));
            });
        });
    }

    /** 根据是否合并过，判断是否需要执行更改css文件内的icon图标路径方法 */
    private refreshCssIconfont (webview: Webview): Promise<void> {
        return new Promise((resolve, reject) => {
            readFileUri(this.newCssUri!).then((css: Uint8Array) => {
                const cssContent = css.toString();
                if (/^.*?#iconfont/.test(cssContent)) {
                    return Promise.resolve(this.cssIconfontPath(cssContent, webview));
                } else {
                    return Promise.reject({ jump: true });
                }
            }).then(css => {
                return writeFileUri(this.newCssUri!, createBuffer(css));
            }).then(() => {
                resolve();
            }).catch(err => {
                if (err.jump) {
                    return resolve();
                }
                reject($rej(err, this.refreshCssIconfont.name, FileMerge.name));
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
                if (!this.isMergeComplete) {
                    return this.cssFileMerge(webview);
                }
            }).then(() => {
                if (!this.isMergeComplete) {
                    return this.jsFileMerge();
                }
            }).then(() => {
                resolve();
            }).catch(err => {
                reject($rej(err, this.development.name, FileMerge.name));
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
                    if (item[1] === FileType.File && checkReg.test(item[0])) {
                        list.push(newUri(uri, item[0]));
                    }
                }
                resolve(list);
            }).catch(err => {
                reject($rej(err, this.readDirectoryFile.name, FileMerge.name));
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
                reject($rej(err, this.mergeAllFile.name, FileMerge.name));
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
                reject($rej(err, this.cssFileMerge.name, FileMerge.name));
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
                reject($rej(err, this.jsFileMerge.name, FileMerge.name));
            });
        });
    }

    /** 合并外部文件内容 */
    private externalFileMerge (type: 'css'|'js'): Promise<string> {
        return new Promise((resolve, reject) => {
            this.mergeAllFile(this.externalFilesUri[type]).then(res => {
                resolve(res);
            }).catch(err => {
                reject($rej(err, this.externalFileMerge.name, FileMerge.name));
            });
        });
    }
}

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