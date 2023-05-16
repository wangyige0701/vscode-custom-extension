
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