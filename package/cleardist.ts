import path from "path";
import fs from "fs";
import { ProcessExit, consoleByColor } from ".";

const root = process.cwd();
const dist = path.join(root, 'dist');

function remove () {
    console.log(consoleByColor('red', '路径：' + dist + ' 删除'));
    try {
        if (fs.existsSync(dist)) {
            fs.rmSync(dist, { recursive: true });
        }
        console.log(consoleByColor('green', '删除成功'));
    } catch (error) {
        ProcessExit('根路径删除错误：' + error, 1);
    }
}

function check (): boolean {
    // 存在uninstall.js文件，表面当前dist文件夹打包内容为生产环境的，需要进行删除
    if (fs.existsSync(path.join(dist, 'uninstall.js'))) {
        return true;
    }
    return false;
}

if (check()) {
    remove();
} else {
    console.log(consoleByColor('blue', '当前打包路径不需要清除'));
}
