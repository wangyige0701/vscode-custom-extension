const path = require('path');
const pathParse = require('./path');

/**
 * 捕获特殊符号
 * 1、通过{}包裹的变量
 * 2、没有变量前缀的*，**
 * 3、有前缀变量的普通字符
 * 4、无论有没有前缀的!、?拼接的字符
 */
const extraSituation = /^(?:(\{[\d\w]+\}(?!\*))?(?:(\*([^\*]*?))|(\*\*)|(\!([^\!]*?))|(\?([^\?]*?))|(?<=\{[\d\w]+\})([^\!\?\*]*?)))$/;
/** 
 * 判断是否是特殊情况 
 * @param {string} result 
 */
function _extraSituation (result) {
    return result.match(extraSituation);
}

/**
 * 返回匹配特殊情况的结果
 * @param {RegExpMatchArray} matchResult
 * @returns {['signle'|'double'|'exclamation'|undefined, string|undefined]}
*/
function _match (matchResult) {
    const handleMatchResult = [];
    if (!matchResult) {
        return handleMatchResult;
    }
    const [_, variable, isSignle, signleSuffix, isDouble, isExclamation, exclamationSuffix, isQuestionMark, questionMarkSuffix, normalString] = matchResult;
    if (isSignle) {
        // 单星号
        handleMatchResult.push('signle', signleSuffix);
    } else if (isDouble) {
        // 双星号
        handleMatchResult.push('double', undefined);
    } else if (isExclamation) {
        // 感叹号
        handleMatchResult.push('exclamation', exclamationSuffix);
    } else if (isQuestionMark) {
        // 问号
        handleMatchResult.push('questionMark', questionMarkSuffix);
    } else {
        handleMatchResult.push(undefined, undefined);
    }
    if (variable) {
        // 传入了变量
        handleMatchResult.push(variable.match(/^\{([\d\w]+)\}$/)[1], normalString);
    }
    return handleMatchResult;
}

/**
 * 单星号情况判断
 * @param {boolean} notMatch 为true表示返回结果未被匹配
 */
function _handleSignle (type, targetValue, value, notMatch = true) {
    return type === 'signle' && Boolean(notMatch ^ targetValue.endsWith(value));
}

/**
 * 感叹号判读
 * @param {boolean} notMatch 为true表示返回结果未被匹配
 */
function _handleExclamation (type, targetValue, value, notMatch = true) {
    return type === 'exclamation' && Boolean(notMatch ^ value.split(',').includes(targetValue));
}

/**
 * 问号判断
 */
function _handleQuestionMark (type, targetValue, value, notMatch = true) {
    return type === 'questionMark' && Boolean(notMatch ^ !value.split(',').includes(targetValue));
}

/** 
 * 规则和目标路径字符串是否匹配
 * @param {string[]} result 用于匹配的数组
 * @param {string[]} target 传入的需要检测的完整路径 */
function _same (result, target) {
    if (typeof target === 'string') {
        target = pathParse(target).pathItem;
    }
    const variables = {};
    function _result (state) {
        return Object.assign({
            state            
        }, state ? { variables } : {});
    }
    /** 匹配传入路径数组 */
    let targetIndex = 0, 
    /** 匹配规则路径数组 */
    resultIndex = 0;
    while (targetIndex < target.length) {
        if (resultIndex >= result.length) {
            return _result(false);
        }
        const t = target[targetIndex], r = result[resultIndex];
        const matchResult = _extraSituation(r);
        if (matchResult) {
            const [type, value, variable, variableSuffix = ''] = _match(matchResult);
            if (variable) {
                // 赋值变量数据
                if (!type) {
                    t.endsWith(variableSuffix) ? 
                    variables[variable] = t.slice(0, t.length - variableSuffix.length) : 
                    variables[variable] = undefined;
                } else {
                    // 在感叹号和问号的情况里，如果校验不通过不会返回变量对象，所以此处可以直接赋值而不需要做额外判断
                    variables[variable] = t;
                }
            }
            const signleOrExclamation = _handleSignle(type, t, value, true) || _handleExclamation(type, t, value, true) || _handleQuestionMark(type, t, value, true);
            if (signleOrExclamation) {
                // 单星号或感叹号或问号
                return _result(false);
            }
            if (type === 'double') {
                // 双星号
                if (result[resultIndex + 1] === '**') {
                    // 一直匹配到最后一个双星号
                    resultIndex++;
                    continue;
                }
                if (_same(result.slice(resultIndex + 1), target.slice(targetIndex))) {
                    return _result(true);
                }
                resultIndex--;
            }
        } else if (t !== r) {
            return _result(false);
        }
        resultIndex++,targetIndex++;
    }
    if (resultIndex < result.length - 1) {
        return _result(false);
    }
    return _result(true);
}

/**
 * 解析路径规则，*：任意一个目录或任意一个文件，**：任意目录包括文件，!：只包含对应目录名或文件名
 * @param {string} str
 */
function rules (str) {
    str = path.resolve(str);
    const resourceResult = str.split('\\').filter(item => item);
    return {
        same: _same.bind(this, resourceResult)
    };
}

// const rele = rules('src/{name1}/{name2}!one,two/**/*.js');
// const compare = path.resolve('src/test/two/file/file2/a.js');
// console.log(rele.same(pathParse(compare).pathItem));

module.exports = rules;