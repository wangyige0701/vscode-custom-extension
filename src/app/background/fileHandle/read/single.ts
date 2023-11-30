


/**
 * 返回.wyg图片文件的base64数据和对应哈希码
 * @param uri 
 * @param code 
 */
export function getFileAndCode (uri: Uri, code: string): Promise<bufferAndCode> {
    return new Promise((resolve, reject) => {
        readFileUri(uri).then(res => {
            resolve({
                buffer: res,
                code
            });
        }).catch(err => {
            reject($rej(err, getFileAndCode.name));
        });
    });
}