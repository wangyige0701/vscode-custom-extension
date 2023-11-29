
/** 图片压缩模块配置项 */
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