/** @typedef {import('rollup').Plugin} RollupPlugin */

const path = require('path');
const fs = require('fs');

const getRelativePosition = require("../utils/relative-position");

function resolveTsPath (tsconfigPath) {
    const matchBase = /\"baseUrl\"\s*:\s*\"([^"]*)\"/;
    const matchPaths = /"paths"\s*:\s*(\{[^\{\}]*\})/
    const jsconfigFile = fs.readFileSync(path.join(process.cwd(), tsconfigPath), 'utf-8');
    const baseUrl = jsconfigFile.match(matchBase)[1];
    const paths = JSON.parse(jsconfigFile.match(matchPaths)[1]);
    const rootPath = process.cwd();
    const cache = [];
    for (const item in paths) {
        let result = paths[item];
        if (typeof result === 'string') {
            result = [result];
        }
        result = result.map(item => path.join(baseUrl, item)).map(item => item.endsWith('*')?item.slice(0, -1):item);
        const checkAll = item.endsWith('*');
        cache.push({
            target: item,
            /** @param {string} str */
            check (str) {
                if (checkAll) {
                    return str.startsWith(item.slice(0, -1));
                }
                return str === item;
            },
            /** @param {string} str */
            replace (str, position) {
                let replaceTarget = item;
                if (checkAll) {
                    replaceTarget = item.slice(0, -1);
                }
                return result.map(item => {
                    const replacedImporter = str.replace(replaceTarget, item);
                    const pathName = path.resolve(rootPath, replacedImporter);
                    return getRelativePosition(position, pathName);
                });
            }
        });
    }

    /** @type {RollupPlugin} */
    const plugin = {
        resolveDynamicImport (specifier, importer) {
            console.log(specifier, importer);
        },
        resolveId (source, importer) {
            // console.log(source, importer);
        },
        buildEnd () {
            // console.log(this.getModuleIds());
        }
    };

    return plugin;
}

module.exports = resolveTsPath;