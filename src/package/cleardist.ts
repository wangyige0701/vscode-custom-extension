import path from "path";
import fs from "fs";
import { ProcessExit, consoleByColor } from ".";

const root = process.cwd();
const dist = path.join(root, 'dist');

console.log(consoleByColor('red', '路径：' + dist + ' 删除'));
try {
    if (fs.existsSync(dist)) {
        fs.rmSync(dist, { recursive: true });
    }
    console.log(consoleByColor('green', '删除成功'));
} catch (error) {
    ProcessExit('根路径删除错误：' + error, 1);
}