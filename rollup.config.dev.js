/** @typedef {import('rollup').RollupOptions} RollupInput */
/** @typedef {import('rollup').Plugin} RollupPlugin */
/** @typedef {import('@rollup/plugin-commonjs').RollupCommonJSOptions} CommonJsOptions */

const commonjs = require('@rollup/plugin-commonjs');
const typescript = require('@rollup/plugin-typescript');
const resolve = require('@rollup/plugin-node-resolve');

const bundle = require("./rollup-plugin/single-file/index");

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

/** @type {CommonJsOptions} */
const commonjsConfig = {
    sourceMap: true,
    exclude: [
        "src/**/*.ts",
        "src/**/*.js"
    ]
};

const externalArrays = ['vscode', 'sharp', 'axios'];

/** @type {RollupInput} */
const config = {
    input: "./src/",
    output: "./dist/",
    external: (id, parentId, isResolved) => {
        if (externalArrays.includes(id)) {
            return true;
        }
        if (parentId) {
            return true;
        }
        return false;
    },
    plugins: [
        typescript(typescriptConfig),
        resolvePlugin,
        commonjs(),
    ]
};

console.log('start');
// bundle(config);