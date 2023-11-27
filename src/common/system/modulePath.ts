/** 获取node主模块文件路径 */
export function getNodeModulePath (): string {
    const module = require.main;
    if (!module) {
        return '';
    }
    return module.filename;
}