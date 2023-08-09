/**
 * 根据扩展版本判断是否需要复制旧版本的某个文件到新版本中
*/

import { checkVersion, getVersionById, refreshVersion } from './utils';
import { getVersion, isDev } from '.';
import { createUri, isFileExits, newUri, uriCopy } from '../utils/file';
import { resolve as pathResolve } from 'path';

/**
 * 只获取当前扩展版本是否修改的状态
 */
const isExtensionVersionChange = !checkVersion('global', false);

// 更新版本信息
if (isExtensionVersionChange) {
    refreshVersion('global', false);
}

/**
 * 扩展的版本改变后将指定路径的文件复制到新版本中
 * @param path 需要拷贝的路径，例如`resources/background`
 */
export function copyFileWhenVersionChange (path: string): Promise<void> {
    return new Promise((resolve, reject) => {
        // 开发环境不进行检测，没有路径或者版本未改变同样跳出
        if (isDev() || !path || !isExtensionVersionChange) {
            resolve();
            return;
        }
        // 存放扩展的根路径，需要根据环境变量分别取值
        const rootPath = createUri(pathResolve(__dirname, '../..'));
        // 获取文件名
        const { publisher, name } = require('../../package.json');
        const lastExtensionVersion = getVersionById('global', 'ExtensionVersion');
        const extensionVersion = getVersion();
        // 获取扩展文件夹名称
        const extensionName = `${publisher}.${name}-${extensionVersion}`;
        const lastExtenstionName = `${publisher}.${name}-${lastExtensionVersion}`;
        // 创建uri
        const nowUri = newUri(rootPath, extensionName, path);
        const lastUri = newUri(rootPath, lastExtenstionName, path);
        Promise.all([
            isFileExits(lastUri),
            isFileExits(newUri(rootPath, extensionName))
        ]).then(([res1, res2]) => {
            if (!res1 || !res2) {
                // 文件之一路径不存在
                resolve();
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
}