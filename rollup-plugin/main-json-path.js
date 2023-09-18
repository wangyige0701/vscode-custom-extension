/** @typedef {import('rollup').Plugin} RollupPlugin */
const path = require("path");

const regexp = /(require\s*\(\s*['"`]\s*)([^'"`]*\.json)(\s*['"`]\s*\))/;

/**
 * 主程序文件中对package.json文件的引用调整
 */
function mainJsonRequireChange (...paths) {
    const targetPath = path.resolve(...paths);
    function checkPosition (relative, id) {
        const sourcePath = path.resolve(id, relative);
        const { dir: targetDir } = path.parse(targetPath);
        const { dir: sourceDir, base } = path.parse(sourcePath);
        let same = true;
        const sourceArray = sourceDir.split('\\');
        const targetArray = targetDir.split('\\');
        const result = [];
        for (let i = 0; i < targetArray.length; i++) {
            const s = sourceArray[i];
            const t = targetArray[i];
            if (same && s === t) {
                continue;
            }
            same = false;
            result.push('..');
        }
        result.push(base);
        return result.join('/');
    }
    /** @type {RollupPlugin} */
    const plugin = {
        name: 'mainJsonRequireChange',
        transform (code, id) {
            if (regexp.test(code)) {
                return code.replace(new RegExp(regexp, 'g'), (s, start, $c, end) => {
                    return `${start}${checkPosition($c, id)}${end}`;
                });
            }
        }
    };
    return plugin;
}

module.exports = mainJsonRequireChange;