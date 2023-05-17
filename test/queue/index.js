
const queue = [];

function set (callback) {
    queue.push(callback);
}

function excute () {
    if (queue.length > 0) {
        queue.shift()?.();
        excute();
    }
}

function a () {
    console.log('a');
}

function b () {
    console.log('b');
}

set(a);
set(b);
excute();