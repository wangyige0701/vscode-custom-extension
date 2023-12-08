/** @description 外部样式css文件模板字符串 */

import type { CssFileAnnotationInfo } from "../../@types";
import { cssTagNameConfig, backgroundDelayShowTime as delay } from "../../data/config";
import { getNewBackgroundOpacity } from "../../common/func";
import { getNowSettingOpacity } from "../../workspace/getter";

/**
 * 生成一个外部css文件中的css字符串
 * @param info 版本、日期、图片数据、透明度和延迟时间的信息
 */
export function externalCssFileTemplate (info: CssFileAnnotationInfo & {
    imageBase64: string;
}) {
    const {
        importStart,
        importEnd
    } = cssTagNameConfig();
    const {
        VSCodeVersion: version,
        ExtensionVersion: extensionVer,
        Date: date,
        ImageCode: codeValue,
        imageBase64: image
    } = info;
    const opacity = getNewBackgroundOpacity(getNowSettingOpacity());
    return `${importStart+'\n'
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
        '\n'+importEnd}`;
}