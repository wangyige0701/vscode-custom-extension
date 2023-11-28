/** @typedef {{ from: string, to: string }[]} Rules */
/** @typedef {{ worker: Rules, package: Rules }} MainOptions */
/** @typedef {import('rollup').Plugin} RollupPlugin */

const { rollup } = require('rollup');
const Regist = require('./parse');
const path = require('path');
const CreateRollup = require('./utils/createRollup');

/**
 * @param {MainOptions} options 
 */
function main (options) {
    const { worker = [], package = [], dynamicImportPackage, dynamicFunction, dynamicObject } = options;
    if (!dynamicImportPackage || !dynamicFunction || !dynamicObject) {
        throw new Error('dynamicImportPackage, dynamicFunction, dynamicObject 属性必须传值');
    }
    const regist = new Regist();
    worker.forEach(item => {
        regist.add(item, 'worker');
    });
    package.forEach(item => {
        regist.add(item, 'package');
    });
    // 需要对url进行标注，首次检测需要加后缀?wangyige，并且添加动态库模块的导入，后续不需要再次导入
    /** @type {RollupPlugin} */
    const plugin = {
        // transform (code, id) {
        //     const matchResult = regist.is(path.resolve(id));
        //     if (matchResult.match) {
        //         console.log(code);
        //         return {
        //             code: void 0,
        //             map: void 0
        //         };
        //     }
        // }
        buildEnd () {
            const ids = this.getModuleIds();
            console.log([...ids].length);
            // 拼接代码，手动写入，通过worker开启多线程
            // for (const id of ids) {
            //     console.log(regist.is(id));
            // }
        }
    };

    return plugin;
}

module.exports = main;