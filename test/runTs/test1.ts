function testPro (time: number = 5000) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(1)
        }, time);
    })
}

let exu = [
    testPro(),
    testPro(1000),
    testPro(2000),
    testPro(3000)
]

Promise.all(exu).then(res => {
    console.log(res);
    let ex = [
        testPro(),
        testPro(1000),
        testPro(2000),
        testPro(3000)
    ]
    return Promise.all(ex);
}).then(res => {
    console.log(res);
    
})