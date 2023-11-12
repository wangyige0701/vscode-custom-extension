/** @typedef {{ rules: string[] }} Rules */
/** @typedef {{ worker: Rules,  }} MainOptions */

const { rollup } = require('rollup');

/**
 * @param {MainOptions} options 
 */
function main (options) {
    const { worker: { rules: workerRules = [] }, package: { rules: packageRules = [] } } = options;
}

module.exports = main;