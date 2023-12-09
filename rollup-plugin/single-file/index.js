/** @typedef {import('rollup').Plugin} RollupPlugin */

const path = require('path');
const fs = require('fs');
const recursiveFiles = require('./recursive');
const { rollup } = require('rollup');

const match = /^[\w\W]*\?[\w\W]*$/;

/** @type {RollupPlugin} */
const plugin = {
    resolveId (source, importer) {
        if (importer, match.test(importer)) {
            return false;
        }
        if (importer) {
            return {
                id: source,
                external: true
            };
        }
    }
};

function main (options) {
    const { input, output, external, plugins = [] } = options;
    // plugins.push(plugin);
    const rootPath = path.resolve(process.cwd(), input);
    const outputPath = path.resolve(process.cwd(), output);
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
    }
    function _create (input, output) {
        return new Promise((resolve, reject) => {
            rollup({
                input,
                external,
                plugins
            })
            .then(bundle => {
                return bundle.write({
                    file: output,
                    format: 'cjs',
                    sourcemap: true,
                    inlineDynamicImports: true
                });
            })
            .then(() => {
                console.log(`生成路径${output}`);
                resolve();
            })
            .catch(reject);
        });
    }
    recursiveFiles(rootPath, async (pathData, resolveData, resolveJsdata) => {
        if (pathData.endsWith('.d.ts') || pathData.includes('@types') || pathData.endsWith('.test.ts') || pathData.endsWith('uninstall.ts')) {
            return;
        }
        const theInput = path.join(input, resolveData);
        const theOutput = path.join(outputPath, resolveJsdata);
        if (pathData.endsWith('.js') || pathData.endsWith('.ts')) {
            await _create(pathData, theOutput);
        } else if (pathData.endsWith('.json')) {
            // 拷贝文件
            const targetPath = path.dirname(theOutput);
            if (!fs.existsSync(targetPath)) {
                fs.mkdirSync(targetPath, { recursive: true });
            }
            console.log(`拷贝文件${pathData}`);
            fs.copyFileSync(pathData, theOutput,);
        }
    });
}

module.exports = main;