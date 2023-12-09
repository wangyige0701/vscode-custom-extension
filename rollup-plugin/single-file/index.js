const path = require('path');
const fs = require('fs');
const recursiveFiles = require('./recursive');
const registWorker = require("./workCore");

function main (options) {
    const { input, output } = options;
    const rootPath = path.resolve(process.cwd(), input);
    const outputPath = path.resolve(process.cwd(), output);
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
    }
    const workerThread = registWorker();
    recursiveFiles(rootPath, (pathData, resolveData, resolveJsdata) => {
        if (pathData.endsWith('.d.ts') || pathData.includes('@types') || pathData.endsWith('.test.ts') || pathData.endsWith('uninstall.ts')) {
            return;
        }
        const theInput = path.join(input, resolveData);
        const theOutput = path.join(outputPath, resolveJsdata);
        if (pathData.endsWith('.js') || pathData.endsWith('.ts')) {
            workerThread.on(pathData, theOutput);
        } else if (pathData.endsWith('.json')) {
            // 拷贝文件
            const targetPath = path.dirname(theOutput);
            if (!fs.existsSync(targetPath)) {
                fs.mkdirSync(targetPath, { recursive: true });
            }
            console.log(`拷贝文件${pathData}`);
            fs.copyFileSync(pathData, theOutput,);
        }
    });
}

module.exports = main;