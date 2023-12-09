// work核心核心处理
const { Worker } = require('worker_threads');

const datas = [];

function regist (number = 5) {
    let runningNumber = 0;
    let allNumber = 0;

    function _create (data) {
        return new Promise((resolve, reject) => {
            const worker = new Worker('./rollup-plugin/single-file/createRollup.js', {
                workerData: data
            });
            worker.once('message', data => {
                if (data === 'done') {
                    resolve();
                }
            });
            worker.once('error', data => {
                reject(data);
            });
        });
    }

    function _run () {
        if (runningNumber < number && datas.length > 0) {
            runningNumber++;
            const data = datas.shift();
            _create({
                input: data.input, 
                output: data.output
            })
            .finally(() => {
                runningNumber--;
                allNumber++;
                _run();
            });
        } else if (datas.length === 0 && runningNumber === 0) {
            result.over?.(allNumber);
        }
    }

    function _on (input, output) {
        datas.push({input, output});
        _run();
    }

    const result = {
        on: _on
    };

    return result;
}

module.exports = regist;