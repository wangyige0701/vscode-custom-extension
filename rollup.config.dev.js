/** @typedef {import('rollup').RollupOptions} RollupInput */
/** @typedef {import('rollup').Plugin} RollupPlugin */
/** @typedef {import('@rollup/plugin-commonjs').RollupCommonJSOptions} CommonJsOptions */

const bundle = require("./rollup-plugin/single-file/index");
const resolveTsPath = require("./rollup-plugin/tsconfig/main");

const path = require('path');

const commonjs = require('@rollup/plugin-commonjs');
const typescript = require('@rollup/plugin-typescript');
const resolve = require('@rollup/plugin-node-resolve');
const json = require('@rollup/plugin-json');

const resolvePlugin = resolve({ preferBuiltins: true });

/** ts解析配置 */
const typescriptConfig = {
    tsconfig: './tsconfig.json',
    compilerOptions: {
        module: "ESNext",
        moduleResolution: "Node",
        sourceMap: true
    }
};

const tsPlugin = typescript(typescriptConfig);

const externalArrays = ['vscode', 'sharp', 'axios'];

function $plugin () {
    // 自定义插件
    const match = /^[\w\W]*\?[\w\W]*$/;

    const matchJson = /require\((?:'([^']*.json)'|"([^"]*.json)")\)/;

    /** @type {RollupPlugin} */
    const replacePlugin = {
        transform (code, id) {
            if (matchJson.test(code)) {
                return code.replace(matchJson, (_, $1, $2) => {
                    const content = $1 || $2;
                    return `require("../${path.basename(content)}")`;
                });
            }
        }
    };
    return replacePlugin;
}

/** @type {RollupInput} */
const config = {
    input: "./src/extension.ts",
    output: "./dist/extension.js",
    watch: "./src/",
    external: (id, parentId, isResolved) => {
        if (externalArrays.includes(id)) {
            return true;
        }
        // if (parentId) {
        //     return true;
        // }
        return false;
    },
    plugins: [
        tsPlugin,
        resolvePlugin,
        commonjs(),
        $plugin(),
        // resolveTsPath("./tsconfig.json")
    ]
};

console.log('start');
bundle(config);