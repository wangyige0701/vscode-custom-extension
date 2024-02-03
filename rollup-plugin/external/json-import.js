/** @typedef {import('rollup').Plugin} RollupPlugin */

const path = require('path');
const fs = require('fs');

const { createHash } = require('crypto');

const { removeDirectory, slashToBack } = require('../utils/file-opt');

const copyJsonFileAndComprss = require('./compress-json');

const Random = require('../utils/folder-create');

const ignoreFileName = /[\w\W]*\.(json|js|ts)\?[\w\W]*/;
const searchRequireJson = /(require\s*\(\s*['"`]\s*)([^'"`]*\.json)(\s*['"`]\s*\))/g;

/**
 * 判断原json文件夹是否删除,删除了则跳过
 */
const isFolderRemove = (func => {
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
function pathToHash(path) {
	return createHash('md5').update(path).digest('hex');
}

/**
 * 外部导入模块中全局导入的json文件路径重置
 * @param {string} rootPath 根路径
 * @param {string} relativePosition 调整后的相对位置路径
 * @param {string|string[]|undefined} checkFilename 需要检测的文件名
 */
function externalJsonFilePathChange(rootPath, relativePosition = '.', checkFilename = void 0) {
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
		resolveId(source, importer) {
			// import导入语句处理
			if (importer && ignoreFileName.test(importer)) {
				// ?commonjs-external文件不处理
				return false;
			}
			if (importer && source && source.endsWith('.json')) {
				// 拷贝json文件
				const fullPath = path.join(importer, '..', source);
				if (!path.isAbsolute(fullPath) || !fs.existsSync(fullPath)) {
					return false;
				}
				const fileName = path.basename(fullPath);
				const folderName = Random.set(pathToHash(fullPath));
				const createPath = path.join(jsonFolder, folderName);
				copyJsonFileAndComprss(rootPath, path.dirname(fullPath), createPath, fileName);
				/** @type {RollupResolveIdResult} */
				const result = {
					id: `${relativePosition}/json/${folderName}/${fileName}`,
					external: true,
					assertions: source,
					resolvedBy: 'externalJsonFilePathChange',
				};
				return result;
			}
		},
		transform(code, id) {
			// 代码文本中的语句修改
			if (checkFilename && checkFilename.some(item => id.endsWith(item))) {
				/**
				 * @param {string} content
				 * @param {RegExp} match
				 */
				function create(content, match) {
					return content.replace(match, (_, $1, $2, $3) => {
						const fullPath = path.join(id, '..', $2);
						if (!path.isAbsolute(fullPath) || !fs.existsSync(fullPath)) {
							return $1 + $2 + $3;
						}
						const fileName = path.basename(fullPath);
						const folderName = Random.set(pathToHash(fullPath));
						const createPath = path.join(jsonFolder, folderName);
						copyJsonFileAndComprss(rootPath, path.dirname(fullPath), createPath, fileName);
						return $1 + `${relativePosition}/json/${folderName}/${fileName}` + $3;
					});
				}
				let result = create(code, searchRequireJson);
				return result;
			}
		},
	};
	return plugin;
}

const searchResolveJson = /(^[\w\W]*path\.resolve\s*\(\s*['"`]\s*)(package\.json)(\s*['"`]\s*\)[\w\W]*$)/;
const searchExitsyncJson = /(^[\w\W]*fs\.existsSync\s*\(\s*['"`]\s*)(package\.json)(\s*['"`]\s*\)[\w\W]*$)/;

/**
 * prebuild-install模块里对sharp模块中的json文件的引用路径调整
 * @param {string} rootPath 根路径
 * @param {string} relativePosition 调整后的相对位置路径
 * @param {string[]} checkFilename 需要检测的文件名
 */
function pacakgeJsonRelativePathChange(rootPath, relativePosition = '..', checkFilename = []) {
	const resetPath = path.resolve(rootPath, 'node_modules', 'sharp', 'package.json');
	const jsonFolder = path.resolve(rootPath, 'dist', 'library', 'json');
	isFolderRemove(jsonFolder);
	if (checkFilename && typeof checkFilename === 'string') {
		checkFilename = [checkFilename];
	}
	if (Array.isArray(checkFilename)) {
		checkFilename = checkFilename.map(item => slashToBack(item));
	}
	const matchTarget = [searchResolveJson, searchExitsyncJson];
	/** @type {RollupPlugin} */
	const plugin = {
		name: 'pacakgeJsonRelativePathChange',
		transform(code, id) {
			if (checkFilename && checkFilename.some(item => id.endsWith(item))) {
				for (const match of matchTarget) {
					const res = code.match(match);
					if (!res) {
						continue;
					}
					const fileName = path.basename(resetPath);
					const folderName = Random.set(pathToHash(resetPath));
					const createPath = path.join(jsonFolder, folderName);
					copyJsonFileAndComprss(rootPath, path.dirname(resetPath), createPath, fileName);
					code = res[1] + `${relativePosition}/json/${folderName}/${fileName}` + res[3];
				}
				return code;
			}
		},
	};
	return plugin;
}

module.exports = {
	externalJsonFilePathChange,
	pacakgeJsonRelativePathChange,
};
