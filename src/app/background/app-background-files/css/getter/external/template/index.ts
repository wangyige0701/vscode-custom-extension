/** @description 获取外部css文件数据 */

import type { CssFileAnnotationInfo } from "../../../../../@types";
import { $rej } from "../../../../../../../error";
import { createExParamPromise } from "../../../../../../../utils";
import { readFileUri } from "../../../../../../../common/file";


/**
 * 生成外部文件设置的背景样式字符串和相关信息，
 * 如果不需要更新数据即当前文件内的哈希码和需要设置的相同，则返回false
 * @param codeValue 图片哈希码
 */
export function getExternalCssContent (codeValue: string): Promise<[string, CssFileAnnotationInfo] | false> {
    return new Promise((resolve, reject) => {
        const extensionVer = getVersion(), date = getDate();
        imageStoreUri().then(uri => {
            return createExParamPromise(getExternalFileContent(), uri);
        }).then(([content, uri]) => {
            return createExParamPromise(getExternalCssInfo(content[0]), uri);
        }).then(([data, uri]) => {
            if (data) {
                const { ImageCode, VSCodeVersion, ExtensionVersion } = data;
                // 如果和上一次是一个哈希值，并且vscode和插件版本号相同，不再更新数据
                if (ImageCode === codeValue && VSCodeVersion === version && ExtensionVersion === extensionVer) {
                    return Promise.reject({ jump: true, data: false });
                }
            }
            return readFileUri(newUri(uri, `${codeValue}.back.wyg`));
        }).then(image => {
            const opacity = getNewBackgroundOpacity(BackgroundConfiguration.getBackgroundOpacity);
            const delay = 2; // 动画延迟的时间
            resolve([
                `${importStart+'\n'
                }/**${'\n'
                }* VSCodeVersion [ ${version} ]${'\n'
                }* ExtensionVersion [ ${extensionVer} ]${'\n'
                }* Date [ ${date} ]${'\n'
                }* ImageCode [ ${codeValue} ]${'\n'
                }*/${'\n'
                }@keyframes vscode-body-opacity-wyg{from{opacity:1;}to{opacity:${opacity};background-size: cover;}}${'\n'
                }body {${'\n'
                }   opacity: ${opacity};${'\n'
                }   background-repeat: no-repeat;${'\n'
                }   background-size: 0;${'\n'
                }   background-position: center;${'\n'
                }   animation: vscode-body-opacity-wyg 2s ease;${'\n'
                }   animation-delay: ${delay}s;${'\n'
                }   animation-fill-mode: forwards;${'\n'
                }   background-image: url('${image}');${'\n'
                }}${
                '\n'+importEnd}`,
                {
                    VSCodeVersion: version,
                    ExtensionVersion: extensionVer,
                    Date: date,
                    ImageCode: codeValue
                }
            ]);
        }).catch(err => {
            if (err.jump) {
                return resolve(err.data);
            }
            reject($rej(err, getExternalCssContent.name));
        });
    });
}

