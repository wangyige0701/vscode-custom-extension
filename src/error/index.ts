/**
 * SyntaxError：语法错误
 * ReferenceError：引用错误
 * RangeError：超出有效范围
 * TypeError：类型错误
 * EvalError：eval方法使用错误
 * URIError：uri地址错误
 */

import { isNumber, isString } from "../utils";
import { showMessage } from "../utils/interactive";
import { isDev } from "../version";
import WError from "./WError";

/** 环境 */
const environment = isDev();

/**
 * 错误统一处理
 * @param e 
 * @param isThrow 是否抛出错误不进行弹框打印
 */
function errlog (e: any, isThrow: boolean = !environment) {
    if (!e) {
        return;
    }
    if (isThrow) {
        console.log(e);
        return;
    }
    environment && console.error(e);
    if (isString(e) || isNumber(e)) {
        showMessage({
            type: 'error',
            message: e.toString(),
            modal: false
        });
        return;
    }
    if (e instanceof WError) {
        showMessage({
            type: 'error',
            message: e.stack??`${e.name}: ${e.message}`,
            modal: false
        });
        return;
    }
    if (e instanceof Error) {
        showMessage({
            type: 'error',
            message: e.stack??`${e.name??'Error'}: ${e.message}`,
            modal: false
        });
        return;
    }
    showMessage({
        type: 'error',
        message: String(e),
        modal: false
    });
}

/**
 * Promise通过reject抛出错误时的错误信息
 * @param err 
 * @param FunctionName 
 * @returns 
 */
function promiseReject(err: any, FunctionName: string, ClassName?:string): WError {
    return new WError('Promise rejected', {
        cause: err,
        position: 'Function',
        FunctionName,
        ClassName
    });
}

export {
    WError,
    errlog,
    promiseReject
};