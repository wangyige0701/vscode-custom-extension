const path = require('path');
const pathParse = require('./path');

/**
 * 解析路径规则，*：任意一个目录或任意一个文件，**：任意目录包括文件，!：只包含对应目录名或文件名
 * @param {string} str
 */
function rules (str) {
    str = path.resolve(str);
    const resourceResult = str.split('\\').filter(item => item);
    const extraSituation = /^(?:(\*([^\*]*?))|(\*\*)|(\!([^\!]*?)))$/;
    /** 判断是否是特殊情况 @param {string} result */
    function _extraSituation (result) {
        return result.match(extraSituation);
    }
    const handleMatchResult = [];
    /**
     * @param {RegExpMatchArray} matchResult
     * @returns {['signle'|'double'|'exclamation'|undefined, string|undefined]}
     */
    function _match (matchResult) {
        handleMatchResult.splice(0, handleMatchResult.length);
        if (!matchResult) {
            return handleMatchResult;
        }
        const [_, isSignle, signleSuffix, isDouble, isExclamation, exclamationSuffix] = matchResult;
        if (isSignle) {
            // 单星号
            handleMatchResult.push('signle', signleSuffix);
        }
        if (isDouble) {
            handleMatchResult.push('double');
        }
        if (isExclamation) {
            handleMatchResult.push('exclamation', exclamationSuffix);
        }
        return handleMatchResult;
    }
    function _handleSignle (type, targetValue, value, notMatch = true) {
        return type === 'signle' && Boolean(notMatch ^ targetValue.endsWith(value));
    }
    function _handleExclamation (type, targetValue, value, notMatch = true) {
        return type === 'exclamation' && Boolean(notMatch ^ value.split(',').includes(targetValue));
    };
    /** 
     * @param {string[]} result 用于匹配的数组
     * @param {string[]} target 传入的需要检测的完整路径 */
    function _same (result, target) {
        /** 匹配传入路径数组 */
        let targetIndex = 0, 
        /** 匹配规则路径数组 */
        resultIndex = 0;
        while (targetIndex < target.length) {
            if (resultIndex >= result.length) {
                return false;
            }
            const t = target[targetIndex], r = result[resultIndex];
            const matchResult = _extraSituation(r);
            if (matchResult) {
                const [type, value] = _match(matchResult);
                const signleOrExclamation = _handleSignle(type, t, value, true) || _handleExclamation(type, t, value, true);
                if (signleOrExclamation) {
                    // 单星号或感叹号
                    return false;
                }
                if (type === 'double') {
                    // 双星号
                    if (result[resultIndex + 1] === '**') {
                        // 一直匹配到最后一个双星号
                        resultIndex++;
                        continue;
                    }
                    if (_same(resourceResult.slice(resultIndex + 1), target.slice(targetIndex))) {
                        return true;
                    }
                    resultIndex--;
                }
            } else if (t !== r) {
                return false;
            }
            resultIndex++,targetIndex++;
        }
        if (resultIndex < result.length - 1) {
            return false;
        }
        return true;
    }
    return {
        same: _same.bind(this, resourceResult)
    };
}

// const rele = rules('src/test/!one,two/**/*.js');
// const compare = path.resolve('src/test/one/file/file2/a.js');
// console.log(rele.same(pathParse(compare).pathItem));

module.exports = rules;