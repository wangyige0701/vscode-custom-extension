/** @typedef {import('rollup').RollupOptions} RollupInput */
/** @typedef {import('rollup').Plugin} RollupPlugin */
/** @typedef {import('rollup').ResolveIdResult} RollupResolveIdResult */
/** @typedef {import('@rollup/plugin-commonjs').RollupCommonJSOptions} CommonJsOptions */

const terser = require('@rollup/plugin-terser');
const commonjs = require('@rollup/plugin-commonjs');
const typescript = require('@rollup/plugin-typescript');
const resolve = require('@rollup/plugin-node-resolve');
const json = require('@rollup/plugin-json');
const path = require('path');
const fs = require("fs");

module.exports = [
    bundle({
        input: 'src/extension.ts',
        output: {
            file: 'dist/extension.js',
            format: 'cjs'
        },
        external: ["vscode"],
    }, {
        font: [
            removeDist(),
            typescript({
                tsconfig: './tsconfig.json',
                compilerOptions: {
                    module: "ESNext",
                    moduleResolution: "Node",
                    sourceMap: false
                }
            })
        ],
        back: [
            changeJsonRequire('..'),
            chngeModuleRequirePath(["axios", "sharp"], ["./library/axios", "./library/sharp"])
        ]
    }),
    bundle({
        input: 'src/uninstall.ts',
        output: {
            file: 'dist/uninstall.js',
            format: 'cjs'
        }
    }, {
        font: [
            typescript({
                tsconfig: './tsconfig.uninstall.json'
            })
        ]
    }),
    bundle({
        input: 'src/library/axios.ts',
        output: {
            file: 'dist/library/axios.js',
            format: 'cjs',
            exports: "default"
        }
    }),
    bundle({
        input: 'src/library/sharp.ts',
        output: {
            file: 'dist/library/sharp.js',
            format: 'cjs',
            exports: "default"
        }
    }, [
        changeSharpJsRequire(),
        changeModuleJsonFile(),
        copyFiles(['node_modules/sharp/build'], ['dist/library/build'], ['node'])
    ], {
        dynamicRequireTargets: '!node_modules/sharp/build/Release/*.node',
        ignoreDynamicRequires: true
    })
];

/**
 * 多输出文件配置
 * @param {RollupInput} config
 * @param {{font:RollupPlugin[];back:RollupPlugin[]}|RollupPlugin[]} plugins font是覆盖在插件之前，back在之后，只传数组默认为back
 * @param {CommonJsOptions} commonjsOpt
 * @returns {RollupInput}
 */
function bundle (config, plugins = { font: [], back: [] }, commonjsOpt = {}) {
    if (Array.isArray(plugins)) {
        plugins = {
            font: [],
            back: plugins
        };
    } else {
        if (typeof plugins !== 'object') {
            plugins = {};
        }
        if (!('font' in plugins)) {
            plugins.font = [];
        }
        if (!('back' in plugins)) {
            plugins.back = [];
        }
    }
    return {
        ...config,
        plugins: [
            ...plugins.font,
            resolve(),
            json({
                preferConst: true
            }),
            commonjs(commonjsOpt),
            terser(),
            ...plugins.back
        ]
    };
}

/** 移除打包目录 */
function removeDist () {
    /** @type {RollupPlugin} */
    const plugin = {
        name: 'removeDist',
        buildStart () {
            const root = process.cwd();
            const dist = path.join(root, 'dist');
            if (fs.existsSync(dist)) {
                fs.rmSync(dist, { recursive: true });
            }
        }
    };
    return plugin;
}

/**
 * 将引用外部json文件的路径修改
 * @param {string} root 根路径
 */
function changeJsonRequire (root = '.') {
    /** @type {RollupPlugin} */
    const plugin = {
        name: 'changeJsonRequire',
        /** @param {string} code */
        transform: function (code, id) {
            try {
                let regexp = /(require\s*\(\s*)(?:'([^']*\.json)'|"([^"]*\.json)")(\s*\))/;
                if (regexp.test(code)) {
                    let repRegexp = new RegExp(regexp, 'g');
                    return code.replace(repRegexp, (s, start, $1, $2, end) => {
                        // $1是匹配单引号，$2是匹配双引号
                        let res = checkPosition($1??$2??'', id);
                        return `${start}"${res.root?root+'/'+res.path:res.path}"${end}`;
                    });
                }
            } catch (error) {
                this.error({ message: 'Replace Require Path Error', id: id, cause: error });
            }
        }
    };
    return plugin;
}

/**
 * 拷贝文件
 * @param {string[]|string} source
 * @param {string[]|string} target
 * @param {string[]|string} suffix 包含的后缀
 */
function copyFiles (source = [], target = [], suffix = []) {
    if (!Array.isArray(target)) {
        target = [target.toString];
    }
    // 先删除所有文件
    for(const p of target) {
        const targetPath = path.join(process.cwd(), p);
        if (fs.existsSync(targetPath)) {
            fs.rmSync(targetPath, { recursive: true });
        }
    }
    /** @type {RollupPlugin} */
    const plugin = {
        name: "copyFiles",
        async generateBundle () {
            // 拷贝node文件
            await copyFilesFunc(source, target, suffix);
        }
    };
    return plugin;
}

/** sharp模块中的node文件导入路径调整 */
function changeSharpJsRequire (target = '\\.\\.', replace = '.') {
    /** @type {RollupPlugin} */
    const plugin = {
        name: "changeSharpJsRequire",
        transform (code, id) {
            try {
                if (id.endsWith('sharp.js')) {
                    const reg = new RegExp(`(^[\\w\\W]*require\\s*\\(.*?)(${target})(.*?\\.node.*?\\)[\\w\\W]*$)`);
                    return code.replace(reg, `$1${replace}$3`);
                }
            } catch (error) {
                this.error({ message: 'Change Sharp Require Error', id: id, cause: error });
            }
        }
    };
    return plugin;
}

/** 外部模块引用的json文件拷贝 */
function changeModuleJsonFile () {
    /** 生成随机字符 */
    const random = {
        /** @type {string[]} */
        folderNames: [],
        /** @returns {string} */
        create (len = 6) {
            const r = Math.random().toString(36).slice(2, len + 2).padEnd(len, '0');
            if (this.folderNames.includes(r)) {
                return this.create(len);
            }
            return r;
        },
        set () {
            const r = this.create();
            this.folderNames.push(r);
            return r;
        },
        get get () {
            return this.folderNames;
        }
    };
    // 删除旧json文件夹
    const procPath = process.cwd();
    const jsonFolder = path.join(procPath, 'dist', 'library', 'json');
    if (fs.existsSync(jsonFolder)) {
        fs.rmSync(jsonFolder, { recursive: true });
    }
    /** @type {RollupPlugin} */
    const plugin = {
        name: 'changeModuleJsonFile',
        async resolveId (code, id) {
            if (id && /[\w\W]*\.(json|js|ts)\?[\w\W]*/.test(id)) {
                // ?commonjs-external文件不处理
                return false;
            }
            if (id && code && code.endsWith('.json')) {
                // 拷贝json文件
                const fullPath = path.join(id, '..', code);
                if (!path.isAbsolute(fullPath)) {
                    return false;
                }
                const fileName = path.basename(fullPath);
                const folderName = random.set();
                const createPath = path.join(jsonFolder, folderName);
                await copyFilesFunc(path.dirname(fullPath), createPath, fileName);
                /** @type {RollupResolveIdResult} */
                const result = {
                    id: `./json/${folderName}/${fileName}`,
                    external: true,
                    assertions: code,
                    resolvedBy: 'changeModuleJsonFile'
                };
                return result;
            }
        }
    };
    return plugin;
}

/** 修改全局引用的导入路径 */
function chngeModuleRequirePath (from = [], to = []) {
    /** @type {RollupPlugin} */
    const plugin = {
        name: 'chngeModuleRequirePath',
        resolveId (code) {
            const index =  from.findIndex(item => item === code);
            if (index >= 0) {
                /** @type {RollupResolveIdResult} */
                const result = {
                    id: to[index]??code[index],
                    external: true,
                    assertions: from,
                    resolvedBy: 'chngeModuleRequirePath'
                };
                return result;
            }
        }
    };
    return plugin;
}

/** 拷贝文件的执行方法 */
async function copyFilesFunc (source = [], target = [], suffix = []) {
    const rootPath = process.cwd();
    [source, target,suffix] = [source, target,suffix].map(item => {
        if (!Array.isArray(item)) {
            return [item.toString()];
        }
        return item;
    });
    for (let i = 0; i < source.length; i++) {
        const s = source[i];
        const t = target[i];
        // 需要使用resolve处理路径，防止两个绝对路径冲突
        const sourcePath = path.resolve(rootPath, s);
        const targetPath = path.resolve(rootPath, t);
        await recursionFolder(sourcePath, targetPath, async (sp, tp) => {
            if (fs.existsSync(tp)) {
                fs.unlinkSync(tp);
            }
            // 判断是否有后缀并校验
            if (suffix.length <= 0 || !!suffix.find(i => sp.endsWith(i))) {
                const dir = path.dirname(tp);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                fs.copyFileSync(sp, tp);
            }
        });
    }
    return Promise.resolve();
}

/**
 * 递归文件夹
 * @param {string} source
 * @param {string} target
 * @param {(s:string, t:string) => Promise<any>} isFile
 * @param {(s:string, t:string) => Promise<any>} isFolder
 */
async function recursionFolder (source, target, isFile) {
    const folder = await handleFolder(source);
    if (folder) {
        fs.readdirSync(source).forEach(async item => {
            await recursionFolder(path.join(source, item), path.join(target, item), isFile);
        });
    } else {
        await isFile?.(source, target);
    }
}

/**
 * 路径位置检测 
 * @param {string} requirePath 
 * @param {string} filePath
 */
function checkPosition (requirePath, filePath) {
    if (!requirePath) {
        return '';
    }
    filePath = path.resolve(filePath, '..');
    let paths = [];
    requirePath.split('/').forEach((item, index) => {
        if (item === '.' && index > 0) {
            throw new Error('Illegal Path');
        } else if (item === '..') {
            filePath = path.resolve(filePath, '..');
        } else {
            paths.push(item);
        }
    });
    return filePath === __dirname ? {
        path: paths.join('/'),
        root: true
    } : {
        path: requirePath,
        root: false
    };
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