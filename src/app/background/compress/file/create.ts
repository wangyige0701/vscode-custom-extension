/** @fileoverview 根据指定路径创建一个压缩图文件 */

import type { Uri } from "vscode";
import { $rej } from "@/error";
import { createExParamPromise } from "@/utils";
import { imageCompression } from "@/common/compression";
import { writeFileUri, createBuffer, base64ByFiletypeAndData } from "@/common/file";

/**
 * 根据原图路径在指定路径下生成压缩图
 * @param uri 生成的图片路径uri
 * @param data 图片base64数据
 */
export function createCompressImage (uri: Uri, data: string): Promise<Buffer> {
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
