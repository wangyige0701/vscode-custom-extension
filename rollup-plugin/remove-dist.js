/** @typedef {import('rollup').Plugin} RollupPlugin */

const { removeDirectory } = require("./utils/file-opt");

/**
 * 移除打包目录
 * @param {string} paths 路径
 */
function removeDist (...paths) {
    /** @type {RollupPlugin} */
    const plugin = {
        name: 'removeDist',
        buildStart () {
            if (paths && paths.length > 0) {
                removeDirectory(...paths);
            }
        }
    };
    return plugin;
}

module.exports = removeDist;