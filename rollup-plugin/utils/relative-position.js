
const splitPath = /([^\/\\]*)(?:\/|\\|\\\\)?/g;

/**
 * @param {string} path
 */
function _splitPath (path) {
    return [...path.matchAll(splitPath)].map(item => item[1]).filter(item => item);
}

/**
 * 生成目标路径相对于引用源文件的相对路径
 * @param {string} target 被修改的路径
 * @param {string} source 源文件路径
 */
function getRelativePosition (target, source) {
    const targetPath = _splitPath(target);
    const sourcePath = _splitPath(source);
    const relative = [], result = [];
    for (let i = 0; i < targetPath.length; i++) {
        if (i >= sourcePath.length) {
            break;
        }
        if (targetPath[i] !== sourcePath[i]) {
            if (i === 0) {
                throw new Error("The start of target path is different to source");
            }
            relative.push(...new Array(targetPath.length - 1 - i).fill(".."));
            result.push(...sourcePath.slice(i));
            break;
        }
    }
    let resultPath = relative.join("/") + "/" + result.join("/");
    if (resultPath.startsWith('/')) {
        resultPath = '.' + resultPath;
    }
    return resultPath;
}

module.exports = getRelativePosition;