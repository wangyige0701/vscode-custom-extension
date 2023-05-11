
/**
 * 获取版本号
 * @returns {string} 版本号
 */
export function getVersion (): string | undefined {
    const json = require('../../package.json');
    return json.version as string;
}