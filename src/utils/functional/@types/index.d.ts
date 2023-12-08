
/** 函数柯里化返回类型推断 */
export type CurryResult<R, A extends any[], I extends any[]> = A extends []
? () => R
: A extends [...I]
? () => R
: A extends [...I, ...infer REST]
? <T extends any[]>(...params: T) => T extends [...REST] ? R : CurryResult<R, A, [...I, ...T]>
: never;

/** 函数管道传入的函数类型 */
export type PipeSingleParamType = (param: any) => any;

export type PipeParamsType = Array<PipeSingleParamType>;

/** 函数管道最终返回的类型 */
export type PipeReturnType<T extends PipeParamsType, P = undefined> = T[0] extends undefined ? P 
: T[0] extends (param: any) => infer R ? PipeReturnType<ExecludeFirstArray<T>, R> : never;

/** 函数管道返回的函数入参类型 */
export type PipeFirstParamType<T extends PipeParamsType> = T[0] extends undefined 
? undefined : T[0] extends (param: infer P) => any ? P : any;