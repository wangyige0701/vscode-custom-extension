const { workerData, parentPort } = require('worker_threads');
const { rollup } = require('rollup');

const { external, plugins } = require("./config");

function _create (input, output) {
    let cache;
    return new Promise((resolve, reject) => {
        console.log(1);
        rollup({
            input,
            // cache,
            external,
            plugins 
        })
        .then(bundle => {
            cache = bundle.cache;
            console.log(2);
            // return bundle.write({
            //     file: output,
            //     format: 'cjs',
            //     sourcemap: true
            // });
        })
        .then(() => {
            console.log(`生成路径${output}`);
            resolve();
        })
        .catch(reject);
    });
}

_create(workerData.input, workerData.output)
.then(() => {
    parentPort.postMessage('done');
})
.catch((err) => {
    throw new Error(err);
});