import { version } from "vscode";

/** 图片压缩模块配置 */
export function compressConfig () {
    return {
        /** 缩略图的存放文件 */
        compressFileName: 'back.min.wyg',
        /** 缩略图存放文件夹 */
        compressFolderName: 'compression'
    };
}

/** 选择图片配置 */
export function imageFilesConfig () {
    return {
        /** 图片类型过滤规则 */
        imageFilters: { 'Images': ['png', 'jpg', 'jpeg', 'gif', 'webp'] }
    };
}

/** css修改配置 */
export function cssNameConfig () {
    return {
        /** vscode的源css文件名 */
        sourceCssFileName: version >= '1.38' ? 'workbench.desktop.main.css' : 'workbench.main.css',
        /** 写背景图样式的外部css文件名 */
        externalCssFileName: 'backgroundImageInfo.css'
    };
}

/** css文件标签配置 */
export function cssTagNameConfig () {
    const tagName = 'wangyige.background'; 
    const tagNameReg = 'wangyige\\.background'; 
    return {
        /** 标签名 */
        tagName,
        /** 标签名正则 */
        tagNameReg,
        /** 开始标签 */
        importStart: `/* ${tagName}.start */`,
        /** 结束标签 */
        importEnd: `/* ${tagName}.end */`,
        /** 匹配开始标签正则 */
        importStartMatch: `\\/\\*\\s\*${tagNameReg}\\.start\\s\*\\*\\/`,
        /** 匹配结束标签正则 */
        importEndMatch: `\\/\\*\\s\*${tagNameReg}\\.end\\s\*\\*\\/`
    };
}
