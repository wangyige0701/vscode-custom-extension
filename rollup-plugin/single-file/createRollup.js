/** @typedef {import('@rollup/plugin-commonjs').RollupCommonJSOptions} CommonJsOptions */
/** @typedef {import('rollup').Plugin} RollupPlugin */

const { workerData, parentPort } = require('worker_threads');
const path = require('path');

const { rollup } = require('rollup');

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

const externalArrays = ['vscode', 'sharp', 'axios'];

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

function _create (input, output) {
    return new Promise((resolve, reject) => {
        rollup({
            input,
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
                typescript(typescriptConfig),
                resolvePlugin,
                json(),
                commonjs(),
                replacePlugin
            ]
        })
        .then(bundle => {
            return bundle.write({
                file: output,
                format: 'cjs',
                sourcemap: true
            });
        })
        .then(() => {
            console.log(`生成路径${output}`);
            resolve();
        })
        .catch(reject);
    });
}

_create(workerData.input, workerData.output)
.then(() => {
    parentPort.postMessage('done');
})
.catch((err) => {
    throw new Error(err);
});