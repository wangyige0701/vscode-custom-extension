/** @typedef {import('rollup').WarningHandlerWithDefault} RollupWarn */
/** @typedef {import('rollup').RollupLog} RollupWarnLog */
/** @typedef {import('rollup').LoggingFunction} RollupWarnFunc */

/**
 * 警告忽略处理函数
 * @param {string|string[]} code
 * @returns {RollupWarn}
 */
module.exports = function (code = '') {
    if (typeof code === 'string') {
        code = [code];
    }
    if (!Array.isArray(code)) {
        throw new Error('Illegal param');
    }
    /**
     * @param {RollupWarnLog} warning
     * @param {RollupWarnFunc} warn
     */
    return function (warning, warn) {
        if (code.includes(warning.code)) {
            return;
        }
        return warn(warning);
    };
};