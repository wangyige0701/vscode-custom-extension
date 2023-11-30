
export type ErrorPosition = 'Function' | 'Class' | 'Parameter';

export type ErrorOptions = {
    cause?:unknown;
    /** 出错的位置名称 */
    position?:ErrorPosition;
    /** 出错的类名 */
    ClassName?:string;
    /** 出错的函数名 */
    FunctionName?:string;
    /** 出错的参数名 */
    ParameterName?:string;
    /** 错误描述 */
    description?:string;
};