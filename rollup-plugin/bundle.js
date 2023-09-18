/** @typedef {import('rollup').RollupOptions} RollupInput */
/** @typedef {import('rollup').Plugin} RollupPlugin */

/**
 * 多输出文件配置
 * @param {RollupInput} config
 * @param {RollupPlugin[]} plugins 
 * @returns {RollupInput}
 */
function bundle (config, plugins = []) {
    return {
        ...config,
        plugins
    };
}

module.exports = bundle;