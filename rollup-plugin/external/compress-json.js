const json5 = require("json5");
const path = require("path");
const fs = require("fs");

/**
 * json文件压缩拷贝
 */
function copyJsonFileAndComprss (rootPath, source, target, fileName = []) {
    if (!Array.isArray(fileName)) {
        fileName = [fileName];
    }
    for (const name of fileName) {
        const sourcePath = path.resolve(rootPath, source, name);
        if (!fs.existsSync(sourcePath)) {
            continue;
        }
        const content = fs.readFileSync(sourcePath, 'utf-8');
        // 如果有注释，json5也能去除
        const result = JSON.stringify(json5.parse(content));
        if (!result) {
            continue;
        }
        const targetPath = path.resolve(rootPath, target, name);
        const dir = path.dirname(targetPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(targetPath, result, { encoding: 'utf-8' });
    }
}

module.exports = copyJsonFileAndComprss;