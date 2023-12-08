/** @description 外部设置背景图样式的css文件修改方法 */

import type { Disposable } from "vscode";
import type { CssFileAnnotationInfo } from "../../@types";
import { WError } from "../../../../error";
import { getExternalCssContent } from "../getter/external";
import { getCssUri } from "../getter/uri";
import { setStatusBarResolve } from "../../../../common/interactive";
import { writeFileUri,createBuffer } from "../../../../common";
import { settingConfiguration } from "../../workspace/setter";
import { setSourceCssImportInfo } from "./source";
import { setBackgroundImageSuccess } from "../../common/interactive";
import { $rej } from "../../../../error";
import { cssNameConfig } from "../../data/config";

/**
 * 修改外部css文件的背景图属性
 * @param hashCode 图片的哈希码
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
        getExternalCssContent(hashCode)
        .then(cssContent => {
            if (cssContent === false) {
                // 不需要更新，直接跳出
                return resolve();
            }
            let statusBarTarget: Disposable | undefined = void 0;
            if (tip) {
                // 状态栏提示文字
                statusBarTarget = setStatusBarResolve({
                    icon: 'loading~spin',
                    message: `${random?'随机':''}背景图设置中`
                });
            }
            return setting(cssContent, random, tip, statusBarTarget);
        })
        .then(resolve)
        .catch(err => {
            reject($rej(err, externalCssFileModify.name));
        });        
    });
}

function setting (cssContent: [string, CssFileAnnotationInfo], random: boolean, tip: boolean, statusBarTarget?: Disposable): Promise<void> {
    return new Promise((resolve, reject) => {
        externalCssFileWrite(cssContent[0])
        .then(() => {
            return settingConfiguration(cssContent[1], random);
        })
        .then(() => {
            return setSourceCssImportInfo();
        })
        .then(() => {
            if (tip) {
                statusBarTarget!.dispose();
                setBackgroundImageSuccess(`${random?'随机':''}背景图设置成功`);
            }
            resolve();
        })
        .catch(reject)
        .finally(() => {
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
        const { externalCssFileName } = cssNameConfig();
        getCssUri(externalCssFileName)
        .then(uri => {
            if (uri) {
                return writeFileUri(uri, createBuffer(content));
            }
        })
        .then(resolve)
        .catch(err => {
            reject($rej(err, externalCssFileWrite.name));
        });
    });
}