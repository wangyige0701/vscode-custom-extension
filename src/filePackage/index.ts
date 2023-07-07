import { existsSync, readdirSync } from "fs";
import path from "path";
import { bisectionAsce } from '../utils/algorithm';

// 打包文件
import postcss from 'postcss';
import cssnano from 'cssnano';
import { minify } from 'terser';

type file_suffix = 'css' | 'js';

/**
 * 压缩js代码
 * @param content 被压缩的js代码
 */
export function minifyJs (content: string): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            minify(content).then((res) => {
                if (res.code) {
                    resolve(res.code);
                } else {
                    resolve('');
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 压缩css代码
 * @param content 被压缩的css代码
 */
export function minifyCss (content: string): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            // 将process第二个参数的from设置为undefinded,防止生成错误的源映射
            postcss([cssnano]).process(content, { from: undefined }).then(res => {
                if (res.css) {
                    resolve(res.css);
                } else {
                    resolve('');
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}

/** 获取webview文件夹根目录 */
export function getRoot () {
    return path.join(process.cwd(), 'webview');
}

/** 读取webview指定目录文件 */
export function readFileDir (): {list:string[], root:string} | undefined {
    const root = path.join(process.cwd(), 'webview/src');
    if (existsSync(root)) {
        return {
            list: readdirSync(root).map(file => path.join(root, file)),
            root
        };
    }
}

/**
 * 判断生产环境压缩包是否存在
 */
export function packageFileExits () {
    let file_param: file_suffix[] = ['css', 'js'];
    try {
        readFileDir()?.list.forEach(file => {
            for (let i = 0; i < file_param.length; i++) {
                let name = file_param[i], folder_path = path.join(file, name);
                if (!(existsSync(folder_path) && readdirSync(folder_path).length > 0)) {
                    continue;
                }
                // 对应目录下的文件存在，进行打包文件检测
                if (!existsSync(path.join(file, `index.production.${name}`))) {
                    throw new Error(`${file}路径下文件未打包`);
                }
            }
        });
        return true;
    } catch (error: any) {
        if (!process.env.NODE_ENV)
            console.error(error.message);
        return false;
    }
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

/** 退出终端 */
export function ProcessExit (content: string, code: number) {
    code > 0 
        ? console.error(content)
        : console.log(content);
    process.exit(code);
}