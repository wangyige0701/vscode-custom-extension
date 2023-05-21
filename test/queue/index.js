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

function time (t = 1000) {
    return new Promise(resolve => {
        setTimeout(() => {
            console.log(t);
            resolve(t);
        }, t);
    });
}

// a(2).then(res => {
//     console.log(res);
//     if (res) {
//         return time();
//     } else {
//         throw new Error('2222')
//     }
// }).then(() => {
//     console.log('end');
// }).catch(err => {
//     console.log(1);
//     console.log(err);
// });

const arr = [1,2,3,4,5,6];

// arr.forEach(async item => {
//     await time();
//     console.log(11111);
// });

async function testa () {
    for (let i = 0; i < arr.length; i++) {
        await time();
        console.log(11111);
    }
}
// testa();

// Promise.allSettled([
//     time(6500),
//     time(1000),
//     time(5000),
//     time(2000),
//     time(500)
// ]).then(res => {
//     console.log(res);
// })

async function testb (array) {
    for (let i = 0; i < array.length; i++) {
        await array[i]().then(() => {
            console.log(1)
        })
    }
}

testb([
    time.bind(2000),
    time.bind(3000),
    time.bind(5000)
])