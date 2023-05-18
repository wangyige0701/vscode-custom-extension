/**
 * SyntaxError：语法错误
 * ReferenceError：引用错误
 * RangeError：超出有效范围
 * TypeError：类型错误
 * EvalError：eval方法使用错误
 * URIError：uri地址错误
 */

import { isNumber, isString } from "../utils";
import { setMessage } from "../utils/interactive";
import { isDev } from "../version";


/**
 * 错误统一处理
 * @param e 
 * @param isThrow 是否抛出错误不进行弹框打印
 */
export function errHandle (e: any, isThrow: boolean = !isDev()) {
    if (isThrow) {
        console.log(e);
        return;
    }
    if (!e) return;
    if (isString(e) || isNumber(e)) {
        setMessage({
            type: 'error',
            message: e.toString(),
            modal: false
        });
        return;
    }
    if (e instanceof Error) {
        setMessage({
            type: 'error',
            message: e.stack??`${e.name??'Error'}:${e.message}`,
            modal: false
        });
    }
}