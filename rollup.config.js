/** @typedef {import('rollup').InputOptions} RollupInput */
/** @typedef {import('rollup').Plugin} RollupPlugin */
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
        }
    }, [
        changeRequire('..'),
    ], {
        dynamicRequireTargets: '!node_modules/sharp/build/Release/*.node',
        ignoreDynamicRequires: true
    }),
    bundle({
        input: 'src/uninstall.ts',
        output: {
            file: 'dist/uninstall.js',
            format: 'cjs'
        }
    })
];

/**
 * 多输出文件配置
 * @param {RollupInput} config
 * @param {RollupPlugin[]} plugins
 * @param {CommonJsOptions} commonjsOpt
 * @returns {RollupInput}
 */
function bundle (config, plugins = [], commonjsOpt = {}) {
    return {
        ...config,
        external: ["vscode", "sharp"],
        plugins: [
            typescript({
                tsconfig: './tsconfig.json',
                compilerOptions: {
                    module: "ESNext",
                    moduleResolution: "Node",
                    sourceMap: false
                }
            }),
            resolve(),
            json({
                preferConst: true
            }),
            commonjs(commonjsOpt),
            terser(),
            ...plugins
        ]
    };
}

/**
 * 将引用外部json文件的路径修改
 * @param {string} root 根路径
 */
function changeRequire (root = '.') {
    /** @type {RollupPlugin} */
    const plugin = {
        name: 'changeRequire',
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
 * @param {string[]} source
 * @param {string[]} target
 * @param {string[]} suffix 包含的后缀
 */
function copyFiles (source = [], target = [], suffix = []) {
    /** @type {RollupPlugin} */
    const plugin = {
        name: "copySharp",
        async generateBundle () {
            await copyFilesFunc(source, target, suffix);
        }
    };
    return plugin;
}

/** sharp模块中的导入路径调整 */
function changeSharpJsRequire (target = '\\.\\.', replace = '.') {
    /** @type {RollupPlugin} */
    const plugin = {
        name: "changeSharoRequire",
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

const checkJsonFiles = /(^[\w\W]*require\s*\()(`[^`]*\.json`|'[^']*\.json'|"[^"]*\.json")(\)[\w\W]*$)/;
const checkJsonFilesGlobal = /(^[\w\W]*require\s*\()(`[^`]*\.json`|'[^']*\.json'|"[^"]*\.json")(\)[\w\W]*$)/g;
const getJsonContent = /(')([^']*)(')|(")([^"]*)(")|(`)([^`]*)(`)/;

function changeModulesJsonFiles () {
    /** @type {RollupPlugin} */
    const plugin = {
        name: 'changeModulesJsonFiles',
        transform (code, id) {
            try {
                if (id.includes('\\node_modules\\') && checkJsonFiles.test(code)) {
                    const match = code.matchAll(checkJsonFilesGlobal);
                    for (const t of match) {
                        console.log(t[2], id);
                        console.log('==========================');
                    }
                }
            } catch (error) {
                this.error({ message: 'Change Modules JsonFiles Error', id: id, cause: error });
            }
        },
        resolveId (code, id) {
            if (id && id.includes('\\node_modules\\') && code.endsWith('.json')) {
                console.log(code, id);
            }
        }
    };
    return plugin;
}

/** 拷贝文件的执行方法 */
async function copyFilesFunc (source = [], target = [], suffix = []) {
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
            // 判断是否有后缀并校验
            if (suffix.length <= 0 || !!suffix.find(i => sp.endsWith(i))) {
                fs.copyFileSync(sp, tp);
            }
        }, async (sp, tp) => {
            if (!fs.existsSync(tp)) {
                fs.mkdirSync(tp, { recursive: true });
            }
        });
    }
    return Promise.resolve();
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

/**
 * 递归文件夹
 * @param {string} source
 * @param {string} target
 * @param {(s:string, t:string) => Promise<any>} isFile
 * @param {(s:string, t:string) => Promise<any>} isFolder
 */
async function recursionFolder (source, target, isFile, isFolder) {
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