/** @typedef {{ from: string, to: string }[]} Rules */
/** @typedef {{ worker: Rules, package: Rules }} MainOptions */

const { rollup } = require('rollup');
const Regist = require('./parse');
const path = require('path');

/**
 * @param {MainOptions} options 
 */
function main (options) {
    const regist = new Regist();
    const { worker = [], package = [] } = options;
    worker.forEach(item => {
        regist.add(item, 'worker');
    });
    package.forEach(item => {
        regist.add(item, 'package');
    });

    // regist.is(path.resolve('src/app/background/time/index.ts'), 'package');
}

main({
    worker: [{
        from: 'src/worker/**',
        to: 'dist/worker'
    }],
    package: [{
        from: 'src/app/{name}/**',
        to: 'dist/app/{name}.js'
    }, {
        from: 'src/{name}?app,extension.ts,uninstall.ts/**',
        to: 'dist/{name}.js'
    }]
});

module.exports = main;