
let unshift = false;

const test = new Proxy([], {
    set (target, key, value, receiver) {
        console.log(target, key, value, receiver);
        const hasKey = target.hasOwnProperty(key);
        const oldValue = target[key];
        if (!hasKey) {
            unshift = false;
            console.log('push');
        } else if (Number(key)) {

        }
        if (key === 'length' && oldValue > value) {
            target.forEach(item => {
                console.log(item);
            })
        }
        return Reflect.set(target, key, value, receiver);
    },

    get (target, key, receiver) {
        return Reflect.get(target, key, receiver);
    }
});

// test.unshift(1);
// test.unshift(2);
// test.push(3);
// test.push(4);
// test.splice(1,1);
// test.splice(0,1);


let data = [];
let target = {
    key: []
}
const test2 = Object.defineProperty(target, 'key', {
    set (newValue) {
        data = newValue;
        console.log(newValue);
    },
    get () {
        console.log(data);
        return data;
    }
})

// test2.key.unshift(1);
// test2.key.unshift(2);
// test2.key.push(3);
// test2.key.push(4);
// test2.key.splice(1,1);
// test2.key.splice(0,1);


const test3 = new Proxy([], {
    set (target, key, value, receiver) {
        // console.log(target, key, value, receiver);
        const hasKey = target.hasOwnProperty(key);
        const oldValue = target[key];
        // if (!hasKey) {
        //     unshift = false;
        //     console.log('push');
        // } else if (Number(key)) {

        // }
        if (key === 'length' && oldValue > value) {
            target.forEach(item => {
                // console.log(item);
            })
        }
        return Reflect.set(target, key, value, receiver);
    },

    get (target, key, receiver) {
        return Reflect.get(target, key, receiver);
    }
});
test3.__proto__ = resetMethods(this);

function resetMethods (data) {
    const oldMethods = Array.prototype;
    const newMethods = Object.create(oldMethods);
    const methods = ['push', 'pop', 'shift', 'unshift', 'splice', 'reverse', 'sort'];
    methods.forEach(method => {
        newMethods[method] = function (...args) {
            // console.log(args);
            let insert;
            switch (method) {
                case 'push':
                case 'unshift':
                    insert = args;
                    break;
                case 'shift':
                    console.log(this[0]);
                    break;
                case 'pop':
                    console.log(this[this.length-1]);
                    break;
                case 'splice':
                    insert = args.slice(2);
                    // console.log(this);
                    // console.log(args[0]);
                    // console.log(this[args[0]]);
                    // console.log(args);
                    break;
                default:
                    break;
            }
            return oldMethods[method].apply(this, args);;
        }
    });
    return newMethods;
}

test3.unshift(1);
test3.unshift(2);
test3.push(3);
test3.push(4);
// test3.splice(1,1);
test3.pop();
test3.shift();
// console.log(test3);
// test3.splice(2,1)
// test3.splice(0,1, 3,4,5);
console.log(test3);