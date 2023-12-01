/** @description 外部设置背景图样式的css文件修改方法 */

import type { Disposable } from "vscode";
import { WError } from "../../../../../../error";

/**
 * 修改外部css文件的背景图属性
 * @param code 图片的哈希码
 * @param random 是否为随机设置背景图状态
 * @param tip 是否需要显示提示文本
 */
export function externalCssFileModify (hashCode: string, random: boolean = false, tip: boolean = true): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!hashCode) {
            return reject(new WError('Undefined Hash Code', {
                position: 'Parameter',
                FunctionName: externalCssFileModify.name,
                ParameterName: 'hashCode',
                description: 'The hash code to get image data is undefined'
            }));
        }
        let statusBarTarget: Disposable;
        getExternalCssContent(hashCode)
        .then(res => {
            if (res === false) {
                // 不需要更新，直接跳出
                return Promise.reject({ jump: true });
            }
            // 状态栏提示文字
            if (tip) {
                statusBarTarget = setStatusBarResolve({
                    icon: 'loading~spin',
                    message: `${random?'随机':''}背景图设置中`
                });
            }
            return createExParamPromise(externalCssFileWrite(res[0]), res[1]);
        }).then(([_, infoContent]) => {
            return settingConfiguration(infoContent, random);
        }).then(() => {
            return setSourceCssImportInfo();
        }).then(() => {
            statusBarTarget?.dispose();
            if (tip) {
                setBackgroundImageSuccess(`${random?'随机':''}背景图设置成功`);
            }
            resolve();
        }).catch(err => {
            // 传递了jump属性就resolve
            if (err.jump) {
                return resolve();
            }
            reject($rej(err, externalCssFileModify.name));
        }).finally(() => {
            statusBarTarget?.dispose();
        });
    });
}

/**
 * 将背景样式写入外部样式文件
 * @param content css文本
 */
export function externalCssFileWrite (content: string): Promise<void> {
    return new Promise((resolve, reject) => {
        getCssUri(externalFileName).then(uri => {
            if (uri) {
                return writeFileUri(uri, createBuffer(content));
            }
        }).then(() => {
            resolve();
        }).catch(err => {
            reject($rej(err, externalCssFileWrite.name));
        });
    });
}