const terser = require('@rollup/plugin-terser');
const commonjs = require('@rollup/plugin-commonjs');
const typescript = require('rollup-plugin-typescript2');
const resolve = require('@rollup/plugin-node-resolve');
const json = require('@rollup/plugin-json');

module.exports = {
    input: 'src/extension.ts',
    output: {
        file: 'out/extension.js',
        format: 'esm'
    },
    plugins: [
        typescript({ 
            tsconfig: './tsconfig.json'
        }),
        resolve(),
        json(),
        commonjs(),
        terser()
    ]
}