
import { test, expect } from "vitest";
import { bisectionAsce, bisectionDesc } from '../src/utils/algorithm';

test("middle", () => {
    let array = [1,2,5,6,8,10,32,43,67,200,2332,4444];
    let test = 39;
    array.splice(bisectionAsce(array, test), 0, test);
    console.log(array);

    let array2 = [4444, 2332, 200, 67, 43, 32, 10, 8, 6, 5, 2, 1];
    let test2 = 999;
    array2.splice(bisectionDesc(array2, test2), 0, test2);
    console.log(array2);
})

test('network', () => {
    const networkUrl = /^(https|http)\:\/\/(\S+)\.([^\?\s]+)(?:\b\?(?!&)(([.]+)=([.]+))(?:&(\1))?)?$/;
    const a = 'https://asdsdsdsds.com?a=1&b=2';

    const test = /(?:\?(?:([^&\s\?]+)=([^&\s\?]+)&?)*)?/;
    console.log('?a=1&b=2&c=3'.match(test));
    

    // console.log(a.match(networkUrl));
    
});

test('~', () => {
    function getRandom (start: number, end: number): number {
        return ~~(Math.random() * (end - start) + start);
    }

    let a = getRandom(0, 4);
    console.log(a);
    
})

import { toHex } from "../src/utils/hash";

test("hash", () => {
    let a = toHex(String(203909090));
    console.log(a);
    
})