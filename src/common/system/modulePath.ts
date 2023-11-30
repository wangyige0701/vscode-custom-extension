import type { ErrorPosition } from "../../error/@types";
import { WError } from "../../error";

/** 获取node主模块文件路径 */
export function getNodeModulePath (): string {
    const module = require.main;
    if (!module) {
        return '';
    }
    return module.filename;
}

/** 模块获取出错时的报错 */
export function getNodeModulePathError (functionName: string, className?: string) {
    return new WError('NodeModule is Undefined', Object.assign({
        description: 'Current Module is not main module. This data is needed to get Css File Path'
    }, functionName ? {
        position: 'Function' as ErrorPosition,
        FunctionName: functionName,
    } : {}, className ? {
        position: 'Class' as ErrorPosition,
        ClassName: className,
    } : {}));
}