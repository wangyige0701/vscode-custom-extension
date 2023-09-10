import fs from "fs";
import path from "path";

// 开发模式下拷贝文件

const source: string[] = [];

const target: string[] = [];

// copy(["ts"]);

async function copy (ignore: string[] = []) {
    const rootPath = process.cwd();
    for (let i = 0; i < source.length; i++) {
        const s = source[i];
        const t = target[i];
        const sourcePath = path.join(rootPath, s);
        const targetPath = path.join(rootPath, t);
        await recursionFolder(sourcePath, targetPath, async (sp, tp) => {
            if (fs.existsSync(tp)) {
                fs.unlinkSync(tp);
            }
            if (ignore.length <= 0 || !ignore.find(item => sp.endsWith(item))) {
                fs.copyFileSync(sp, tp);
            }
        }, async (sp, tp) => {
            if (!fs.existsSync(tp)) {
                fs.mkdirSync(tp);
            }
        });
    }
}

/** 递归文件夹 */
async function recursionFolder (source: string, target: string, isFile: (s:string,t:string)=>any, isFolder: (s:string,t:string)=>any) {
    const folder = await handleFolder(source);
    if (folder) {
        await isFolder?.(source, target);
        fs.readdirSync(source).forEach(async item => {
            await recursionFolder(path.join(source, item), path.join(target, item), isFile, isFolder);
        });
    } else {
        await isFile?.(source, target);
    }
}

/** 判断是否是文件夹 */
function handleFolder (path: string) {
    return new Promise((resolve, reject) => {
        fs.stat(path, (err, data) => {
            if (err) {
                return reject(err);
            }
            return resolve(data.isDirectory());
        });
    });
}