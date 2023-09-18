/** @typedef {import('rollup').Plugin} RollupPlugin */

const regexp = /(require\s*\(.*?)(\.\.)(.*?\.node.*?\))/;

/**
 * sharp模块中node二进制文件导入路径调整
 */
function sharpNodeRequireChange () {
    /** @type {RollupPlugin} */
    const plugin = {
        name: 'sharpNodeRequireChange',
        transform (code, id) {
            if (id.endsWith('sharp.js')) {
                const res = code.match(regexp);
                if (res) {
                    return code.replace(regexp, `$1.$3`);
                }
            }
        }
    };
    return plugin;
}

module.exports = sharpNodeRequireChange;