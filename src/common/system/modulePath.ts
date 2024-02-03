import type { ErrorPosition } from '@/error/@types';
import path from 'path';
import { WError } from '@/error';

/** 获取node主模块文件路径 */
export const getNodeModulePath = (() => {
	let module = (eval('require') as NodeRequire).main;
	let file: string | undefined;
	if (!module) {
		file = undefined;
	} else {
		file = path.dirname(module.filename);
	}
	module = undefined;
	return function () {
		return file;
	};
})();

/** 模块获取出错时的报错 */
// prettier-ignore
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
