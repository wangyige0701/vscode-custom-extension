/**
 * 是否是开发环境，本地调试环境变量是development，生产环境没有NODE_ENV
 * @returns 
 */
export function isDev (): boolean {
    return process.env.NODE_ENV === "development";
}

/**
 * 获取版本号
 * @returns {string} 版本号
 */
export function getVersion (): string {
    const json = require('../../package.json');
    return json.version as string;
}