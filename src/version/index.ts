

const PROJECT_ENV: "development" | "production" = "development";

/**
 * 是否是开发环境
 * @returns 
 */
export function isDev (): boolean {
    return PROJECT_ENV === "development";
}

/**
 * 获取版本号
 * @returns {string} 版本号
 */
export function getVersion (): string {
    const json = require('../../package.json');
    return json.version as string;
}