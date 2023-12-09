/** @typedef {import('rollup').RollupOptions} RollupInput */
/** @typedef {import('rollup').Plugin} RollupPlugin */

const bundle = require("./rollup-plugin/single-file/index");

/** @type {RollupInput} */
const config = {
    input: "./src/extension.ts",
    output: "./dist/"
};

console.log('start');
bundle(config);