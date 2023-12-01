/** @description 删除背景图文件 */


/**
 * 根据哈希码删除.wyg图片文件
 * @param code 需要删除图片的哈希码
 */
export function deleteFileStore (code: string): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!hasHashCode(code)) {
            return reject(new WError('Undefined Hash Code', {
                position: 'Parameter',
                FunctionName: deleteFileStore.name,
                ParameterName: 'code',
                description: 'The hash code to delete image is undefined'
            }));
        }
        imageStoreUri().then(uri => {
            // 原图删除
            return uriDelete(newUri(uri, `${code}.back.wyg`));
        }).then(() => {
            // 删除压缩图
            return deleteCompressByCode(code);
        }).then(() => {
            return codeListRefresh(code, 'delete', {});
        }).then($code => {
            resolve($code);
        }).catch(err => {
            reject($rej(err, deleteFileStore.name));
        });
    });
}