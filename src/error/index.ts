/**
 * SyntaxError：语法错误
 * ReferenceError：引用错误
 * RangeError：超出有效范围
 * TypeError：类型错误
 * EvalError：eval方法使用错误
 * URIError：uri地址错误
 */


/**
 * 错误统一处理
 * @param e 
 */
export function errHandle (e: Error) {
    console.error(
        `name:${e.name}\n`,
        `message:${e.message}`
    );
}