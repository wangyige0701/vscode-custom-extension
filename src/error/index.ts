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


/**
 * 错误统一处理
 * @param e 
 */
export function errHandle (e: any) {
    if (!e) return;
    if (isString(e) || isNumber(e)) {
        setMessage({
            type: 'error',
            message: (e as string | number).toString(),
            modal: false
        });
        return;
    }
    if (e instanceof Error) {
        setMessage({
            type: 'error',
            message: `name:${e.name}\nmessage:${e.message}`,
            modal: false
        });
    }
}