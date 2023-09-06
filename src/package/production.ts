import { existsSync, readdir } from "fs";
import { minifyJs, minifyCss, readFileDir, getRoot, ProcessExit, now_ver, getContent, writeContent, consoleByColor, createExParamPromise } from ".";
import { bisectionAsce } from '../utils/algorithm';
import path from "path";

type file_suffix = 'css' | 'js';

interface glo<T> {
    [key: string]: T;
}

interface external extends glo<string[]> {
    css: string[];
    js: string[];
}

type external_file = {
    [prop in keyof external]: string[];
};

type dir_check = {list:string[],root:string,name:file_suffix};

/**
 * 在生产环境发布前，需要对所有webview的js、css文件进行压缩合并，
*/
if (!process.env.NODE_ENV) {
    console.log(consoleByColor('blue', '开始预发布webview相关文件打包...'));
    let file_param: file_suffix[] = ['css', 'js'];
    let root = getRoot();
    /** 文件路径存放 */
    const ext_files: {
        css: string[];
        js: string[];
    } = {
        css: [],
        js: []
    };
    const now_version = now_ver();
    var ver_text = `/* version: ${now_version} */`;
    // 获取公共css、js文件
    const getAllExternalFile: Promise<[string[], file_suffix]>[] = file_param.map(item => {
        return createExParamPromise(dir_content(path.join(root, item)), item);
    });
    Promise.all(getAllExternalFile).then((datas) => {
        for (const data of datas) {
            const [files, name] = data;
            for (const file of files) {
                if (!(name in ext_files)) {
                    continue;
                }
                // 判断文件后缀名是否相同
                if (!file.endsWith(name)) {
                    continue;
                }
                // 文件数据插入数组
                ext_files[name].push(path.join(root, name, file));
            }
        }
        return toPackage(file_param, { css: ext_files.css, js: ext_files.js });
    }).then(() => {
        ProcessExit(consoleByColor('green', `\n打包完成   （预发布版本：v${now_version}）\n`), 0);
    }).catch(err => {
        ProcessExit(consoleByColor('red', err), 1);
    });
}

/** 预发布webview相关css、js文件整合打包 */
function toPackage (file_param: file_suffix[], external_files: external_file): Promise<void> {
    return new Promise((resolve, reject) => {
        let execute: Promise<any>[] | null = [];
        readFileDir()!.list.forEach(file => {
            file_param.forEach((name: file_suffix) => {
                let file_path = path.join(file, name), exits = existsSync(file_path);
                // 获取对应css、js文件夹目录
                if (exits) {
                    execute!.push(right_dir(name, file_path, file));
                }
            });
        });
        Promise.all(execute).then(res => {
            // 首先合并外部公共文件
            return external_merge(external_files, res);
        }).then(res => {
            execute = [];
            res[1].forEach((item: {list: string[], root: string, name: file_suffix}) => {
                execute!.push(mergeFile(item.list, path.join(item.root, `index.production.${item.name}`), item.name, res[0][item.name]));
            });
            return Promise.all(execute);
        }).then(() => {
            resolve();
        }).catch(err => {
            reject(err);
        }).finally(() => {
            execute = null;
        });
    });
}

/**
 * 判断目录下文件格式是否正确
 */
function right_dir (name: file_suffix, file_path: string, root: string): Promise<dir_check> {
    return new Promise((resolve, reject) => {
        const checkReg = new RegExp(`\\.${name}$`), list: string[] = [];
        dir_content(file_path).then(res => {
            // 获取具体后缀文件路径
            res.forEach(item => {
                if (item && checkReg.test(item)) {
                    list.push(path.join(file_path, item));
                }
            });
            resolve({list, root, name});
        }).catch(err => {
            reject(err);
        });
    });
}

/** 获取目录内容 */
function dir_content (pathName: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        if (!pathName) {
            reject('Undefinded Path');
            return;
        }
        readdir(pathName, 'utf-8', (err, files) => {
            if (err) {
                reject(err);
            } else {
                resolve(files);
            }
        });
    });
}

/** 根据类型合并文件 */
function mergeFile (list: string[], pathName: string, type: file_suffix, external_content: string): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!list || list.length <= 0) {
            resolve(type);
            return;
        }
        Promise.all(list.map(file => {
            return getContent(file);
        })).then(res => {
            return mergeWebviewFile(res);
        }).then(res => {
            if (type === 'css') {
                // css导入外部全局样式
                return Promise.resolve(external_content + '\n' + res);
            } else {
                // js文本写入局部作用域内
                return Promise.resolve(`(function () {${external_content + '\n' + res}})();`);
            }
        }).then(res => {
            if (type === 'css') {
                return minifyCss(res);
            } else {
                return minifyJs(res);
            }
        }).then(res => {
            // 文件内容不为空则写入
            if (res) {
                return writeContent(pathName, ver_text+res);
            }
        }).then(() => {
            resolve(type);
        }).catch(err => {
            reject(err);
        });
    });
}

/**
 * 合并外部js、css文件
 * @param file_path 
 * @returns 
 */
function external_merge (file_path: external_file, returnValue: dir_check[]): Promise<[glo<string>, dir_check[]]> {
    return new Promise((resolve, reject) => {
        const result: Promise<{type:string,content:string}>[] = [];
        for (let name in file_path) {
            result.push(new Promise(($resolve, $reject) => {
                let paths: string[] = file_path[name];
                external_merge_work(paths).then(res => {
                    $resolve({ type: name, content: res });
                }).catch(err => {
                    $reject(err);
                });
            }));
        }
        Promise.all(result).then(res => {
            resolve([res.reduce((pre, curr) => {
                pre[curr.type] = curr.content;
                return pre;
            }, {} as glo<string>), returnValue]);
        }).catch(err => {
            reject(err);
        });
    });
}

/**
 * 外部文件内容排序合并
 * @param paths 
 * @returns 
 */
function external_merge_work (paths: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
        if (paths.length <= 0) {
            resolve('');
            return;
        }
        Promise.all(paths.map(item => {
            return getContent(item);
        })).then(res => {
            return mergeWebviewFile(res);
        }).then(res => {
            resolve(res);
        }).catch(err => {
            reject(err);
        });
    });
}

/**
 * 将不同文件下的Uint8Array数据转为字符串，按序合并返回
 * @param data 
 * @returns 
 */
function mergeWebviewFile (data: string[] | Uint8Array[]): string {
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