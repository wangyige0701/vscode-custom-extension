import { CurryResult } from "./types";

/**
 * 柯里化函数
 * @description 固定一个参数，得到该函数剩余参数的一个新函数，如果没有剩余参数则调用
 */
export function curry<T extends any[], K extends any[], P> (func: (...params: [...T, ...K]) => P, ...param: T): (...residue: K) => P;
export function curry<T extends any[], K extends any[], P, E extends any[]> (func: (...params: [...T, ...K, ...E]) => P, ...param: T): (...residue: K) => CurryResult<T, K, [...T, ...K, ...E], P>;
export function curry<T extends any[], K extends any[], P> (func: (...params: [...T, ...K]) => P, ...param: T) {
    return function (...residue: K) {
        const args: [...T, ...K] = [...param, ...residue];
        if (args.length >= func.length) {
            return func(...args);
        } else {
            return curry(func, ...args as any);
        }
    };
}