/** @fileoverview 删除背景图文件 */

import { WError, $rej } from "@/error";
import { uriDelete, newUri } from "@/common/file";
import { hashCodeCache } from "@background/data/hashCodeCache";
import { codeListRefresh } from "@background/data-operate/imageCache";
import { deleteCompressByCode } from "@background/compress/file/remove";
import { imageStoreUri } from "../folder/getter";

/**
 * 根据哈希码删除.wyg图片文件
 * @param code 需要删除图片的哈希码
 */
export function deleteFileStore (hashCode: string): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!hashCodeCache.hasHashCode(hashCode)) {
            return reject(new WError('Undefined Hash Code', {
                position: 'Parameter',
                FunctionName: deleteFileStore.name,
                ParameterName: 'code',
                description: 'The hash code to delete image is undefined'
            }));
        }
        imageStoreUri()
        .then(uri => {
            // 原图删除
            return uriDelete(newUri(uri, `${hashCode}.back.wyg`));
        })
        .then(() => {
            // 删除压缩图
            return deleteCompressByCode(hashCode);
        })
        .then(() => {
            return codeListRefresh(hashCode, 'delete', {});
        })
        .then(code => {
            resolve(code);
        })
        .catch(err => {
            reject($rej(err, deleteFileStore.name));
        });
    });
}
