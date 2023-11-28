import { firstStrUpperCase, firstStrLowerCase, splitByUpperCase, splitBySpace, allStrLowerCase } from "../main";
import { pipe, curry } from "../functional";

function everyArr (func: (item: string) => string, arr: string[]): string[] {
    return arr.map(func);
}

function mergeArr (mergeStr: string, arr: string[]) {
    return arr.join(mergeStr);
}

/** 根据空格分隔字符串并返回驼峰格式字符串 */
export const splitBySpaceAndCamelCase = pipe(
    splitBySpace, 
    curry(everyArr, allStrLowerCase), 
    curry(everyArr, firstStrUpperCase), 
    curry(mergeArr, ''), 
    firstStrLowerCase
);

/** 根据大写字母分隔字符串并返回空格拼接的所有字母都小写的字符串 */
export const splitByUpperCaseAndJoinWithSpaceLow = pipe(
    splitByUpperCase,
    curry(everyArr, allStrLowerCase),
    curry(mergeArr, ' ')
);

/** 根据大写字母分隔字符串并返回空格拼接的首字母大写的字符串 */
export const splitByUpperCaseAndJoinWithSpaceUp = pipe(
    splitByUpperCase,
    curry(everyArr, allStrLowerCase),
    curry(everyArr, firstStrUpperCase),
    curry(mergeArr, ' ')
);
