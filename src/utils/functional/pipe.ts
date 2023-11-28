import { PipeParamsType, PipeReturnType, PipeFirstParamType } from "./types";

/**
 * 函数管道
 * @description 传递任意数量的单参函数，每一个函数的返回值作为下一个函数的入参，依次调用。返回一个函数，传入初始参数
 */
export function pipe<T extends PipeParamsType> (...funcs: T): (param: PipeFirstParamType<T>) => PipeReturnType<T> {
    if (funcs.some(arg => typeof arg !== 'function')) {
        throw new Error('All arguments must be function');
    }
    /** 参数必须是单参 */
    return function (param: PipeFirstParamType<T>) {
        return funcs.reduce((prev, curr) => {
            return curr(prev);
        }, param) as PipeReturnType<T>;
    };
}