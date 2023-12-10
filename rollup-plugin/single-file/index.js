const path = require('path');
const fs = require('fs');
const recursiveFiles = require('./recursive');
const registWorker = require("./workCore");
const { rollup } = require('rollup');

// const workerThread = registWorker();

let cache;

function create (module) {
    const allPromise = [];
    for (const item of module) {
        const { code, id } = item;
    }
}

async function execute (input, output) {
    const bundle = await rollup(input);
    if (bundle) {
        // cache = bundle.cache;
        // console.log(bundle.cache.modules[20]);
        // create(cache.modules);
        bundle.write({
            file: output,
            format: 'cjs',
            sourcemap: true
        });
    }
}

function main (options) {
    const { input, output, watch, external, plugins } = options;
    const rootPath = path.resolve(process.cwd(), input);
    const outputPath = path.resolve(process.cwd(), output);
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
    }
    rollup({
        input,
        external,
        plugins
    }).then(bundle => {
        return bundle.write({
            file: output,
            format: 'cjs',
            sourcemap: true
        });
    }).then(() => {
        console.log('build success');
    }).catch(err => {
        throw new Error(err);
    });
    // // 遍历路径
    // recursiveFiles(rootPath, (pathData, resolveData, resolveJsdata) => {
    //     if (pathData.endsWith('.d.ts') || pathData.includes('@types') || pathData.endsWith('.test.ts') || pathData.endsWith('uninstall.ts')) {
    //         return;
    //     }
    //     const theInput = path.join(input, resolveData);
    //     const theOutput = path.join(outputPath, resolveJsdata);
    //     if (pathData.endsWith('.js') || pathData.endsWith('.ts')) {
    //         workerThread.on(pathData, theOutput);
    //     } else if (pathData.endsWith('.json')) {
    //         // 拷贝文件
    //         const targetPath = path.dirname(theOutput);
    //         if (!fs.existsSync(targetPath)) {
    //             fs.mkdirSync(targetPath, { recursive: true });
    //         }
    //         console.log(`拷贝文件${pathData}`);
    //         fs.copyFileSync(pathData, theOutput,);
    //     }
    // });
}

module.exports = main;