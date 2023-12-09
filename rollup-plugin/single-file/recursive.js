const fs = require('fs');
const path = require('path');

/**
 * 遍历文件夹
 * @param {string} pathData 
 */
function recursiveFiles (pathData, callback) {
    if (!fs.existsSync(pathData)) {
        return;
    }
    if (typeof callback !== 'function') {
        return;
    }
    const isPromise = typeof callback.then === 'function' || callback[Symbol.toStringTag] === "AsyncFunction";
    async function _run (_pathData, resolvePathData) {
        if (isFile(_pathData)) {
            const dirname = path.dirname(resolvePathData);
            let basename = path.basename(resolvePathData);
            if (basename.endsWith('.ts')) {
                basename = basename.replace('.ts', '.js');
            }
            const outputJsfile = path.join(dirname, basename);
            if (isPromise) {
                await callback(_pathData, resolvePathData, outputJsfile);
            } else {
                callback(_pathData, resolvePathData, outputJsfile);
            }
        } else {
            const files = fs.readdirSync(_pathData);
            for (const file of files) {
                const filePath = path.resolve(_pathData, file);
                await _run(filePath, path.join(resolvePathData, file));
            }
        }
    }
    _run(pathData, '');
}

function isFile (filePath) {
    try {
        return fs.statSync(filePath).isFile() ? true : false;
    } catch (error) {
        throw new Error(error);
    }
}

module.exports = recursiveFiles;