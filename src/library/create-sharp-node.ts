import type { ExtensionContext } from "vscode";
import { readdirSync, existsSync, copyFileSync, rmSync } from "fs";
import { parse, resolve as pathResolve } from "path";
import { spawnSync } from "child_process";
import { setStatusBarResolve } from "../common/interactive";

/**
 * .node二进制文件是否存在
 */
function isNodeBinaryFileExits (path: string) {
    const filepath = pathResolve(path, 'dist', 'library', 'build', 'Release');
    if (!existsSync(filepath)) {
        return false;
    }
    return readdirSync(filepath).some(item => item.endsWith('.node'));
}

/**
 * 创建node文件的命令
 */
function createSharpNodeFile (path: string) {
    const cdPath = pathResolve(path, 'dist', 'library');
    spawnSync("node", ["install/use-libvips"], {
        cwd: cdPath
    });
    spawnSync("node", ["install/copy"], {
        cwd: cdPath
    });
    spawnSync("node", ["bin"], {
        cwd: pathResolve(cdPath, 'install')
    });
}

/**
 * 拷贝node文件并删除不需要的文件
 */
function copyFile (path: string) {
    const source = pathResolve(path, 'dist', 'library', 'install', 'build', 'Release');
    if (!existsSync(source)) {
        return;
    }
    const target = pathResolve(path, 'dist', 'library', 'build', 'Release');
    if (!existsSync(target)) {
        return;
    }
    readdirSync(source).forEach(item => {
        const file = pathResolve(source, item);
        const { base } = parse(file);
        if (base) {
            copyFileSync(file, pathResolve(target, item));
        }
    });
    rmSync(pathResolve(path, 'dist', 'library', 'install', 'build'), { recursive: true });
    rmSync(pathResolve(path, 'dist', 'library', 'vendor'), { recursive: true });
}

/**
 * 检测是否需要执行node命令生成sharp需要的二进制文件
 */
export function isNeedToCreateSharpBinaryFile (context: ExtensionContext) {
    try {
        let pathName = context.extensionUri.fsPath;
        if (IS_PRODUCTION && !isNodeBinaryFileExits(pathName)) {
            let status = setStatusBarResolve({
                icon: "loading~spin",
                message: "生成sharp二进制文件中"
            });
            createSharpNodeFile(pathName);
            copyFile(pathName);
            status.dispose();
        }
    } catch (error) {
        console.error(error);
    }
}