/** @typedef {import('rollup').Plugin} RollupPlugin */

const { removeDirectory, copyFileFromSource } = require("./utils/file-opt");

/**
 * 拷贝文件
 * @param {string} rootPath
 * @param {string[]|string} source
 * @param {string[]|string} target
 * @param {string[]|string} suffix
 */
function copyFiles (rootPath, source = [], target = [], suffix = []) {
    for (const path of (Array.isArray(target)?target:[target])) {
        removeDirectory(rootPath, path);
    }
    /** @type {RollupPlugin} */
    const plugin = {
        name: "copyFiles",
        async generateBundle () {
            // 拷贝node文件
            await copyFileFromSource(rootPath, source, target, suffix);
        }
    };
    return plugin;
}

module.exports = copyFiles;