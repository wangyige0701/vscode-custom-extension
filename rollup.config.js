const terser = require('@rollup/plugin-terser');
const commonjs = require('@rollup/plugin-commonjs');
const typescript = require('rollup-plugin-typescript2');
const resolve = require('@rollup/plugin-node-resolve');
const json = require('@rollup/plugin-json');

module.exports = {
    input: 'src/extension.ts',
    output: {
        file: 'dist/extension.js',
        format: 'cjs'
    },
    plugins: [
        typescript({ 
            tsconfig: './tsconfig.json',
            tsconfigOverride: {
                compilerOptions: {
                    module: "ESNext",
		            moduleResolution: "Node"
                }
            }
        }),
        resolve(),
        json(),
        commonjs(),
        terser(),
        changeRequire('..')
    ]
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
                        let res = checkPosition($1??$2??'');
                        return `${start}"${root}/${res}"${end}`;
                    });
                }
            } catch (error) {
                this.error({ message: 'Replace Require Path Error', id: id, cause: error });
                return null;
            }
        }
    }
}

/** @param {string} path */
function checkPosition (path) {
    if (!path) return '';
    let parent = 0, paths = [];
    path.split('/').forEach((item, index) => {
        if (item === '.' && index > 0) throw new Error('Illegal Path');
        else if (item === '..') parent++;
        else paths.push(item);
    });
    return paths.join('/');
}