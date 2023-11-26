// 解析路径数据
const path = require('path');

const typeMatch = /^.*\.([^\.]*)$/;

const splitPath = /([^\/\\]*)(?:\/|\\|\\\\)?/g;

/**
 * 解析路径数据
 * @param {string} pathData
 */
function pathParse (pathData) {
    const baseName = path.basename(pathData);
    const dirName = path.dirname(pathData);
    const typeResult = baseName.match(typeMatch);
    return {
        baseName,
        dirName,
        pathItem: [...pathData.matchAll(splitPath)].map(item => item[1]).filter(item => item),
        dirItem: [...dirName.matchAll(splitPath)].map(item => item[1]).filter(item => item),
        baseType: typeResult ? typeResult[1] : ''
    };
}

module.exports = pathParse;