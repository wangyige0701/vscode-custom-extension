
/** 函数柯里化返回类型推断 */
export type CurryResult<T extends any[], K extends any[],  A extends any[], P> = A extends [...T, ...K, ...infer E] 
? CurryRecallType<T, K, P, E> 
: CurryRunType<K, P>;

/** 传入参数大于等于形参长度的返回结果，直接运行，返回P */
type CurryRunType<K extends any[], P> = (...residue: K) => P;

/** 传入参数长度不足，返回再次调用curry函数的结果 */
type CurryRecallType<
    T extends any[], K extends any[], P, E extends any[] = []
> = CurryRunType<K, CurryResult<T, K, [...T, ...K, ...E], P>>;

/** 函数管道传入的函数类型 */
export type PipeSingleParamType = (param: any) => any;

export type PipeParamsType = Array<PipeSingleParamType>;

/** 函数管道最终返回的类型 */
export type PipeReturnType<T extends PipeParamsType, P = undefined> = T[0] extends undefined ? P 
: T[0] extends (param: any) => infer R ? PipeReturnType<ExecludeFirstArray<T>, R> : never;

/** 函数管道返回的函数入参类型 */
export type PipeFirstParamType<T extends PipeParamsType> = T[0] extends undefined 
? undefined : T[0] extends (param: infer P) => any ? P : any;