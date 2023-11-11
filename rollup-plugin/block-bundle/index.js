/** @typedef {{ rules: string[] }} MainOptions */

const { rollup } = require('rollup');

/**
 * @param {MainOptions} options 
 */
function main (options) {
    const { rules = [] } = options;
}

module.exports = main;