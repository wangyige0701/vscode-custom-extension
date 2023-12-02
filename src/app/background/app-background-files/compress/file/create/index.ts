

import type { Uri } from "vscode";


/**
 * 根据原图路径在指定路径下生成压缩图
 * @param uri 生成的图片路径uri
 * @param data 图片base64数据
 */
function createCompressImage (uri: Uri, data: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        imageCompression(data)
        .then(buffer => {
            // 将图片数据转为base64
            return base64ByFiletypeAndData('image', 'webp', buffer);
        })
        .then(base64 => {
            const buffer = createBuffer(base64);
            return createExParamPromise(writeFileUri(uri, buffer), buffer);
        })
        .then(([_, buffer]) => {
            resolve(buffer);
        })
        .catch(err => {
            reject($rej(err, createCompressImage.name));
        });
    });
}