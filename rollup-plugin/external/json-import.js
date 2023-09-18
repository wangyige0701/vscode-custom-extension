/** @typedef {import('rollup').Plugin} RollupPlugin */

const path = require("path");
const fs = require('fs');

const { createHash } = require("crypto");

const { removeDirectory, copyFileFromSource, slashToBack } = require("../utils/file-opt");

const random = require("../utils/folder-create");

const ignoreFileName = /[\w\W]*\.(json|js|ts)\?[\w\W]*/;
const searchRequireJson = /(^[\w\W]*require\s*\(\s*['"`]\s*)([^'"`]*\.json)(\s*['"`]\s*\)[\w\W]*$)/;

/**
 * 判断原json文件夹是否删除,删除了则跳过
 */
const isFolderRemove = ((func) => {
    let state = false;
    return function (jsonFolder) {
        if (state) {
            return;
        }
        func?.(jsonFolder);
        state = true;
    };
})(jsonFolder => removeDirectory(jsonFolder));

/**
 * 路径数据转为哈希码
 * @param {string} path
 */
function pathToHash (path) {
    return createHash('md5').update(path).digest('hex');
}

/**
 * 外部导入模块中全局导入的json文件路径重置
 */
function externalJsonFilePathChange (rootPath, relativePosition = '.', checkFilename = void 0) {
    const jsonFolder = path.resolve(rootPath, 'dist', 'library', 'json');
    isFolderRemove(jsonFolder);
    if (checkFilename && typeof checkFilename === 'string') {
        checkFilename = [checkFilename];
    }
    if (Array.isArray(checkFilename)) {
        checkFilename = checkFilename.map(item => slashToBack(item));
    }
    /** @type {RollupPlugin} */
    const plugin = {
        name: 'externalJsonFilePathChange',
        async resolveId (code, id) {
            if (id && ignoreFileName.test(id)) {
                // ?commonjs-external文件不处理
                return false;
            }
            if (id && code && code.endsWith('.json')) {
                // 拷贝json文件
                const fullPath = path.join(id, '..', code);
                if (!path.isAbsolute(fullPath) || !fs.existsSync(fullPath)) {
                    return false;
                }
                const fileName = path.basename(fullPath);
                const folderName = random.set(pathToHash(fullPath));
                const createPath = path.join(jsonFolder, folderName);
                await copyFileFromSource(rootPath, path.dirname(fullPath), createPath, fileName, { deleteFile: false, first: true });
                /** @type {RollupResolveIdResult} */
                const result = {
                    id: `${relativePosition}/json/${folderName}/${fileName}`,
                    external: true,
                    assertions: code,
                    resolvedBy: 'jsonFileResolvePathChange'
                };
                return result;
            }
        },
        async transform (code, id) {
            if (checkFilename && checkFilename.some(item => id.endsWith(item))) {
                /**
                 * @param {string} content
                 * @param {RegExp} match
                 */
                async function create (content, match) {
                    const res = content.match(match);
                    if (res) {
                        const fullPath = path.join(id, '..', res[2]);
                        if (!path.isAbsolute(fullPath) || !fs.existsSync(fullPath)) {
                            return content;
                        }
                        const fileName = path.basename(fullPath);
                        const folderName = random.set(pathToHash(fullPath));
                        const createPath = path.join(jsonFolder, folderName);
                        await copyFileFromSource(rootPath, path.dirname(fullPath), createPath, fileName, { deleteFile: false, first: true });
                        return res[1] + `${relativePosition}/json/${folderName}/${fileName}` + res[3];
                    }
                    return content;
                }
                let result = await create(code, searchRequireJson);
                return result;
            }
        }
    };
    return plugin;
}

const searchResolveJson = /(^[\w\W]*path\.resolve\s*\(\s*['"`]\s*)(package\.json)(\s*['"`]\s*\)[\w\W]*$)/;
const searchExitsyncJson = /(^[\w\W]*fs\.existsSync\s*\(\s*['"`]\s*)(package\.json)(\s*['"`]\s*\)[\w\W]*$)/;

/**
 * prebuild-install模块下对sharp中json文件的引用路径调整
 */
function pacakgeJsonRelativePathChange (rootPath, relativePosition = '..', fileName = []) {
    const resetPath = path.resolve(rootPath, 'node_modules', 'sharp', 'package.json');
    const jsonFolder = path.resolve(rootPath, 'dist', 'library', 'json');
    fileName = fileName.map(item => slashToBack(item));
    /** @type {RollupPlugin} */
    const plugin = {
        name: 'pacakgeJsonRelativePathChange',
        async transform (code, id) {
            for (const match of [searchResolveJson, searchExitsyncJson]) {
                const res = code.match(match);
                if (!res) {
                    continue;
                }
                const fileName = path.basename(resetPath);
                const folderName = random.set(pathToHash(resetPath));
                const createPath = path.join(jsonFolder, folderName);
                await copyFileFromSource(rootPath, path.dirname(resetPath), createPath, fileName, { deleteFile: false, first: true });
                code = res[1] + `${relativePosition}/json/${folderName}/${fileName}` + res[3];
            }
            return code;
        }
    };
    return plugin;
}

module.exports = {
    externalJsonFilePathChange,
    pacakgeJsonRelativePathChange
};