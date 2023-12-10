const { workerData, parentPort } = require('worker_threads');
const { rollup } = require('rollup');

const { external, plugins } = require('./config');

async function _create (input, output) {
    const bundle = await rollup({
        input,
        external,
        plugins 
    });
    console.log(bundle);
    // bundle.write({
    //     file: output,
    //     format: 'cjs',
    //     sourcemap: true
    // });
    // console.log(`生成路径${output}`);
    parentPort.postMessage('done');
}

_create(workerData.input, workerData.output);