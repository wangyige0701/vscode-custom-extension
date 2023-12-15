/** 根据扩展版本判断是否需要复制旧版本的某个文件到新版本中 */
import type { Uri } from 'vscode';
import { resolve as pathResolve } from 'path';
import { checkVersion, refreshVersion, getVersionById } from './private/utils';
import { createUri, isFileExits, newUri, uriCopy } from '@/common/file';

export {
    checkVersion,
    refreshVersion
};

/** 只获取当前扩展版本是否修改的状态 */
const isExtensionVersionChange = !checkVersion('global', false);

/* 更新版本信息 */
if (isExtensionVersionChange) {
    refreshVersion('global', false);
}

interface CopyFil {
    (path: string): Promise<void>;
    /** 校验不同版本文件的检测数据 */
    $config: {
        rootPath: Uri;
        extensionName: string;
        lastExtenstionName: string;
    } | null;
}

/**
 * 扩展的版本改变后将指定路径的文件复制到新版本中
 * @param path 需要拷贝的路径，例如`resources/background`
 */
export const copyFileWhenVersionChange: CopyFil = (path: string) => {
    return new Promise((resolve, reject) => {
        // 开发环境不进行检测，没有路径或者版本未改变同样跳出
        if (IS_DEVELOPMENT || !isExtensionVersionChange || !path) {
            return resolve();
        }
        if (!copyFileWhenVersionChange.$config) {
            // 存放扩展的根路径，由于只在生产环境下执行，所以，只需要获取到向上两层根目录
            const rootPath = createUri(pathResolve(__dirname, '../..'));
            const lastExtensionVersion = getVersionById('global', 'ExtensionVersion');
            // 获取扩展文件夹名称
            const extensionName = `${PUBLISHER}.${PACKAGE_NAME}-${EXTENSION_VERSION}`;
            const lastExtenstionName = `${PUBLISHER}.${PACKAGE_NAME}-${lastExtensionVersion}`;
            copyFileWhenVersionChange.$config = {
                rootPath,
                extensionName,
                lastExtenstionName
            };
        }
        const { rootPath, extensionName, lastExtenstionName } = copyFileWhenVersionChange.$config,
        // 创建uri
        nowUri = newUri(rootPath, extensionName, path),
        lastUri = newUri(rootPath, lastExtenstionName, path);
        Promise.all([
            isFileExits(lastUri),
            isFileExits(newUri(rootPath, extensionName))
        ]).then(([res1, res2]) => {
            // 文件之一路径不存在
            if (!res1 || !res2) {
                return;
            }
            // 复制文件
            return uriCopy(lastUri, nowUri, { overwrite: true });
        }).then(() => {
            resolve();
        }).catch(err => {
            reject(err);
        });
    });
};
copyFileWhenVersionChange.$config = null;
