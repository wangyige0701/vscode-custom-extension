import { CurryResult } from "./@types";

/**
 * 柯里化函数
 * @description 固定一个参数，得到该函数剩余参数的一个新函数，如果没有剩余参数则调用
 */
export function curry<R, A extends any[], I extends any[]> (func: (...params: A) => R, ...params: I): CurryResult<R, A, I> {
    return <CurryResult<R, A, I>>function (...residue: any[]) {
        const args = [...params, ...residue];
        if (args.length >= func.length) {
            return func(...args as any);
        } else {
            return curry(func, ...args as any);
        }
    };
}