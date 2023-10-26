/** @typedef {import('rollup').Plugin} RollupPlugin */

const path = require("path");

const matchRequire = /(require\s*\(\s*[`'"])(.*)([`'"]\s*\))/;

/**
 * 修改全局引用的导入路径,禁止外部模块内容导入
 * @param {string} rootPath 根路径
 * @param {string[]} from
 * @param {string[]} to
 */
function mainModuleRequirePathChange (rootPath, from = [], to = []) {
    const checkPath = path.join(rootPath, 'src', 'library', 'importer');
    /** @type {RollupPlugin} */
    const plugin = {
        name: 'mainModuleRequirePathChange',
        resolveId (code) {
            const index =  from.findIndex(item => item === code);
            if (index >= 0) {
                /** @type {RollupResolveIdResult} */
                const result = {
                    id: to[index]??code[index],
                    external: true,
                    assertions: from,
                    resolvedBy: 'mainModuleRequirePathChange'
                };
                return result;
            }
        },
        transform (code, id) {
            // 对非直接引用的导入语句进行解析并修改
            if (id.startsWith(checkPath)) {
                const result = code.match(matchRequire);
                if (result && from.includes(result[2])) {
                    const index = from.indexOf(result[2]);
                    return code.replace(matchRequire, `$1${to[index]}$3`);
                }
            }
        }
    };
    return plugin;
}

module.exports = mainModuleRequirePathChange;