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

/**
 * \/#! ... #/ 注释删除
 */
function removeAbsoluteNote () {
    /** @type {RollupPlugin} */
    const plugin = {
        name: 'removeAbsoluteNote',
        transform (code, id) {
            return code.replace(/\/\*\!(?:[\w\W](?!(?:\/\*\!?)))*\*\//g,'');
        }
    };
    return plugin;
}

module.exports = {
    lineCodeRemove,
    removeAbsoluteNote
};