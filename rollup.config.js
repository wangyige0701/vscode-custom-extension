const terser = require('@rollup/plugin-terser');
const commonjs = require('@rollup/plugin-commonjs');
const typescript = require('@rollup/plugin-typescript');
const resolve = require('@rollup/plugin-node-resolve');
const json = require('@rollup/plugin-json');
const path = require('path');

module.exports = [
    bundle({
        input: 'src/extension.ts',
        output: {
            file: 'dist/extension.js',
            format: 'cjs'
        }
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
 * @param {Object} config
 */
function bundle (config) {
    return {
        ...config,
        external: ["vscode"],
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
            json(),
            commonjs(),
            terser(),
            changeRequire('..')
        ]
    };
}

/**
 * 将引用外部json文件的路径修改
 * @param {string} root 根路径
 * @returns 
 */
function changeRequire (root = '.') {
    return {
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
                return null;
            }
        }
    };
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