import { existsSync, readdir } from "fs";
import { minifyJs, minifyCss, readFileDir, getRoot, ProcessExit, now_ver, getContent, writeContent } from ".";
import { bisectionAsce } from '../utils/algorithm';
import path from "path";

type file_suffix = 'css' | 'js';

const global_css = ['reset.css', 'vscode.css'];

/**
 * 在生产环境发布前，需要对所有webview的js、css文件进行压缩合并，
*/
if (!process.env.NODE_ENV) {
    console.log('开始预发布webview相关文件打包...');
    let file_param: file_suffix[] = ['css', 'js'];
    let root = getRoot();
    var external = global_css.map(item => path.join(root, item));
    var ver_text = `/* version: ${now_ver()} */`;
    toPackage(file_param);
}

/** 预发布打包打包 */
function toPackage (file_param: file_suffix[]) {
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
        execute = [];
        res.forEach((item: {list: string[], root: string, name: file_suffix}) => {
            execute!.push(mergeFile(item.list, path.join(item.root, `index.production.${item.name}`), item.name));
        });
        return Promise.all(execute);
    }).then(() => {
        execute = null;
        ProcessExit('打包完成\n', 0);
    }).catch(err => {
        ProcessExit(err, 1);
    });
}

/**
 * 判断目录下文件格式是否正确
 */
function right_dir (name: file_suffix, file_path: string, root: string): Promise<{list:string[],root:string,name:file_suffix}> {
    return new Promise((resolve, reject) => {
        const checkReg = new RegExp(`\\.${name}$`), list: string[] = [];
        dir_content(file_path).then(res => {
            // 获取具体后缀文件路径
            res.forEach(item => {
                if (item && checkReg.test(item))
                    list.push(path.join(file_path, item));
            });
            resolve({list, root, name});
        }).catch(err => {
            reject(err);
        });
    });
}

/** 获取目录内容 */
function dir_content (path: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        if (!path) {
            reject('Undefinded Path');
            return;
        }
        readdir(path, 'utf-8', (err, files) => {
            if (err) {
                reject(err);
            } else {
                resolve(files);
            }
        });
    });
}

/** 根据类型合并文件 */
function mergeFile (list: string[], path: string, type: file_suffix): Promise<string> {
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
            if (type === 'css')
                // css导入外部全局样式
                return external_css(res);
            else
                // js文本写入局部作用域内
                return Promise.resolve(`(function () {${res}})();`);
        }).then(res => {
            if (type === 'css')
                return minifyCss(res);
            else
                return minifyJs(res);
        }).then(res => {
            // 文件内容不为空则写入
            if (res)
                return writeContent(path, ver_text+res);
        }).then(() => {
            resolve(type);
        }).catch(err => {
            reject(err);
        });
    });
}

/** 外部全局css文件合并 */
function external_css (css: string): Promise<string> {
    return new Promise((resolve, reject) => {
        let files: Promise<any>[] = [];
        external.forEach(file => {
            files.push(getContent(file));
        });
        Promise.all(files).then(res => {
            resolve(res.join('') + css);
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