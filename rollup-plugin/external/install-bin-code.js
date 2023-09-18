/** @typedef {import('rollup').Plugin} RollupPlugin */

/**
 * 首行#!...代码删除
 */
function lineCodeRemove () {
    /** @type {RollupPlugin} */
    const plugin = {
        name: 'lineCodeRemove',
        transform (code, id) {
            if (id.endsWith("bin.js")) {
                return code.replace(/\#\!.*?(\n|$)/,'');
            }
        }
    };
    return plugin;
}

module.exports = lineCodeRemove;