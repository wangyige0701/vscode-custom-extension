
const fs = require("fs");
const path = require("path");

/**
 * 删除指定目录文件
 * @param {string[]} paths 指定目录的绝对路径
 */
function removeDirectory (...paths) {
    const dist = path.resolve(...paths);
    if (fs.existsSync(dist)) {
        fs.rmSync(dist, { recursive: true });
    }
}

/**
 * 拷贝文件
 * @param {string} rootPath 根路径
 * @param {string[]} source 被拷贝的文件路径
 * @param {string[]} target 目标路径
 * @param {string[]} suffix 文件后缀名或者文件名
 */
async function copyFileFromSource (rootPath, source = [], target = [], suffix = [], config = {}) {
    [source, target,suffix] = [source, target,suffix].map(item => {
        if (!Array.isArray(item)) {
            return [item.toString()];
        }
        return item;
    });
    const { deleteFile = true, first = false } = config;
    for (let i = 0; i < source.length; i++) {
        const s = source[i];
        const t = target[i];
        // 需要使用resolve处理路径，防止两个绝对路径冲突
        const sourcePath = path.resolve(rootPath, s);
        const targetPath = path.resolve(rootPath, t);
        if (first) {
            await noRecursionCopy(sourcePath, targetPath, suffix, deleteFile);
            continue;
        }
        await recursionFolder(sourcePath, targetPath, async (sp, tp) => {
            if (fs.existsSync(tp)) {
                if (deleteFile) {
                    fs.rmSync(tp, { recursive: true });
                } else {
                    return;
                }
            }
            // 判断是否有后缀并校验
            if (suffix.length <= 0 || suffix.some(i => sp.endsWith(i))) {
                const dir = path.dirname(tp);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                fs.copyFileSync(sp, tp);
            }
        });
    }
}

/**
 * 不进行遍历直接复制文件
 */
async function noRecursionCopy (sourcePath, targetPath, suffix = [], deleteFile) {
    for (const val of suffix) {
        sourcePath = path.resolve(sourcePath, val);
        targetPath = path.resolve(targetPath, val);
        if (fs.existsSync(sourcePath)) {
            if (fs.existsSync(targetPath)) {
                if (deleteFile) {
                    fs.rmSync(targetPath, { recursive: true });
                } else {
                    return;
                }
            }
            const dir = path.dirname(targetPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.copyFileSync(sourcePath, targetPath);
        }
    }
}

/**
 * 递归文件夹
 * @param {string} source
 * @param {string} target
 * @param {(s:string, t:string) => Promise<any>} isFile
 * @param {(s:string, t:string) => Promise<any>} isFolder
 */
async function recursionFolder (source, target, isFile) {
    const folder = await handleFolder(source).catch(err => { throw new Error(err); });
    if (folder) {
        fs.readdirSync(source).forEach(async item => {
            await recursionFolder(path.join(source, item), path.join(target, item), isFile);
        });
    } else {
        await isFile?.(source, target);
    }
}

/** 判断是否是文件夹 */
function handleFolder (path) {
    return new Promise((resolve, reject) => {
        fs.stat(path, (err, data) => {
            if (err) {
                return reject(err);
            }
            return resolve(data.isDirectory());
        });
    });
}

/**
 * 路径中的斜杠转为反斜杠
 * @param {string} path
 */
function slashToBack (path) {
    return path.replace(/\//g, '\\');
}

module.exports = {
    removeDirectory,
    copyFileFromSource,
    slashToBack
};