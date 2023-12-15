/**
 * SyntaxError：语法错误
 * ReferenceError：引用错误
 * RangeError：超出有效范围
 * TypeError：类型错误
 * EvalError：eval方法使用错误
 * URIError：uri地址错误
 */

import { isNumber, isString } from "@/utils";
import { showMessageWithConfirm } from "@/common/interactive";
import WError from "./WError";

/**
 * 错误统一处理
 * @param e
 * @param isThrow 是否抛出错误不进行弹框打印
 */
function errlog (e: any, isThrow: boolean = (NODE_ENV === "production")): void {
    if (!e) {
        return;
    }
    console.log(e.toString(true));
    if (isThrow) {
        return;
    }
    if (isString(e) || isNumber(e)) {
        showMessageWithConfirm(e.toString(), "error");
        return;
    }
    if (e instanceof WError) {
        showMessageWithConfirm(e.toString(false), "error");
        return;
    }
    if (e instanceof Error) {
        showMessageWithConfirm(e.stack??`${e.name??'Error'}: ${e.message}`, "error");
        return;
    }
    showMessageWithConfirm(String(e), "error");
}

/**
 * Promise通过reject抛出错误时的错误信息
 * @param err
 * @param FunctionName
 * @returns
 */
function $rej(err: any, FunctionName: string, ClassName?:string): WError {
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
    $rej
};
