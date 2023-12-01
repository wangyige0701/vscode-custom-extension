/** @description 背景图配置数据删除模块 */



/** 删除外部和源css文件中背景图的相关设置内容 */
export function deleteBackgroundCssFileModification (): Promise<void> {
    return new Promise((resolve, reject) => {
        getSourceCssFileContent().then(data => {
            if (data) {
                // 删除源css文件
                return deleteContentByTagName(...data);
            }
        }).then(data => {
            if (data) {
                const { content, uri } = data!;
                return sourceCeeFileChangeChecksum(uri, createBuffer(content));
            }
        }).then(() => {
            // 删除外部css文件
            return getExternalCssFileContent();
        }).then(data => {
            return deleteContentByTagName(...data);
        }).then(({ content, uri }) => {
            return uriDelete(uri);
        }).then(() => {
            return deleteConfiguration();
        }).then(() => {
            setBackgroundImageSuccess("背景图配置删除成功");
            resolve();
        }).catch(err => {
            reject($rej(err, deleteBackgroundCssFileModification.name));
        });
    });
}