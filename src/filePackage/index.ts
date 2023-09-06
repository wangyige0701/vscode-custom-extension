import { existsSync, readdirSync, readFile, writeFile } from "fs";
import path from "path";

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
            postcss([cssnano]).process(content, { from: void 0 }).then(res => {
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
export function packageFileExits (): string[] | false {
    try {
        let result: string[] = [];
        readFileDir()?.list.forEach(file => {
            for (const name of (['css', 'js'] as file_suffix[])) {
                let folder_path = path.join(file, name);
                if (!(existsSync(folder_path) && readdirSync(folder_path).length > 0)) {
                    continue;
                }
                // 对应目录下的文件存在，进行打包文件检测
                let file_path = path.join(file, `index.production.${name}`);
                if (!existsSync(file_path)) {
                    throw new Error(`${file}路径下文件未打包`);
                }
                result.push(file_path);
            }
        });
        return result;
    } catch (error: any) {
        if (!process.env.NODE_ENV) {
            console.error(error.message);
        }
        return false;
    }
}

/**
 * 获取预发布版本号
 */
export function now_ver () {
    const json = require('../../package.json');
    return json.version as string;
}

/** 退出终端 */
export function ProcessExit (content: string, code: number) {
    code > 0 
        ? console.error(content)
        : console.log(content);
    process.exit(code);
}

/** 写文件 */
export function writeContent (path: string, content: string): Promise<void> {
    return new Promise((resolve, reject) => {
        writeFile(path, content, err => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });
    });
}

/** 读文件 */
export function getContent (path: string): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!path) {
            reject('Undeinded Path');
            return;
        }
        readFile(path, 'utf-8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

/**
 * 返回带有颜色的字符串
 * @param color string
 * @param content 需要生成颜色的字符串
 */
export function consoleByColor (color: 'red'|'green'|'blue'|'yellow', content: string): string {
    switch (color) {
        case 'red':
            return `\x1B[31m${content}\x1B[0m`;
        case 'green':
            return `\x1B[32m${content}\x1B[0m`;
        case 'yellow':
            return `\x1B[33m${content}\x1B[0m`;
        case 'blue':
            return `\x1B[34m${content}\x1B[0m`;
        default:
            return content;
    }
}