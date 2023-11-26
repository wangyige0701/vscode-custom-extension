/** @typedef {import('rollup').RollupOptions} RollupOptions */

const { rollup } = require('rollup');

/**
 * 未注册的路径，生成一个新的rollup对象，新对象的规则中排除当前规则，否则直接插入数据
 */
class CreateRollup {
    store = new Map();

    constructor () {}

    /**
     * @param {string} path
     */
    create (path, options) {
        if (!this.store.has(path)) {
            /** @type {RollupOptions} */
            const config = {};
        }
    }
}

module.exports = CreateRollup;