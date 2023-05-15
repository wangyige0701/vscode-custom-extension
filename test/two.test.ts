
import { test, expect } from "vitest";
import { bisectionAsce } from '../src/utils/algorithm';

test("middle", () => {
    let array = [1,2,5,6,8,10,32,43,67,200,2332,4444];
    let test = 766;
    array.splice(bisectionAsce(array, test), 0, test);
    console.log(array);
})