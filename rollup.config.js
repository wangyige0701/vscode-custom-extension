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
        terser()
    ]
}