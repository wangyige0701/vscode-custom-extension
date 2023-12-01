/** @description css文件相关信息匹配正则信息 */

import {
    anySpace as s,
    anyCharacter as a,
    anyCharacterWithoutSpace as ans,
    anyCharacterWithoutWrap as ant,
    sideNoSpace as asa,
    anyNumber as n,
    anyWord as w,
    anyWordAndNumber as nw,
    strToReg
} from "../../../../../../utils/regexp";
import { cssTagNameConfig } from "../../../../config/data";

const {
    importEndMatch,
    importStartMatch
} = cssTagNameConfig();

/** 匹配源及外部css文件修改内容标签范围，捕获标签中的内容 */
export const findSourceCssPosition = strToReg(`${importStartMatch}(${a})${importEndMatch}`);

/** 捕获源css文件引用文本中的问号后接内容 */
export const findSourceCssVersionContent = strToReg(
    `(${importStartMatch}${a}@import${s}url\\(${s}"${a}\\.css\\?)(${nw})("${s}\\);${a}${importEndMatch})`
);

/** 匹配外部css文件并捕获注释信息 */
export const findExternalCssPosition = strToReg(
    `${importStartMatch}${a}${
        getReg('VSCodeVersion')
    }${a}${
        getReg('ExtensionVersion')
    }${a}${
        getReg('Date')
    }${a}${
        getReg('ImageCode')
    }${a}${importEndMatch}`
);

/** 获取外部css文件中的透明度值 */
export const findExternalCssOpacityData = strToReg(
    `${importStartMatch}${a}body${s}\{${a}opacity${s}\:${s}(${ans})${s};${a}\}${a}${importEndMatch}`
);

/** 对外部css文件的透明度进行修改的正则，包括动画样式内的透明度 */
export const externalCssOpacityModify = strToReg(
    `(${importStartMatch}${a
    }vscode-body-opacity-wyg${s}\{${a}to${s}\{${a
    }opacity${s}\:${s})(${ans})(${s};${a}\}${a}body${s}\{${a
    }opacity${s}\:${s})(${ans})(${s};${a}\}${a}${importEndMatch})`
);

/**
 * 生成获取外部文件注释信息的正则
 * @param name 
 * @param catchData 是否需要捕获对应数据
 */
function getReg (name: string, catchData: boolean = true): string {
    if (catchData) {
        return `${name}${s}\\[${s}(${asa})${s}\\]`;
    }
    return `${name}${s}\\[${s}${asa}${s}\\]`;
}