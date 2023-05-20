/* 
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
excute(); */

function a (t) {
    return new Promise((resolve, reject) => {
        if (t === 2) {
            // throw new Error('1111');
            resolve(false)
        }
        console.log(1111);
        resolve(true);
    })
}

function time () {
    return new Promise(resolve => {
        setTimeout(resolve, 5000);
    });
}

a(2).then(res => {
    console.log(res);
    if (res) {
        return time();
    } else {
        throw new Error('2222')
    }
}).then(() => {
    console.log('end');
}).catch(err => {
    console.log(1);
    console.log(err);
});