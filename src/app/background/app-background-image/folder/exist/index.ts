
import type { Uri } from "vscode";
import { WError, $rej } from "../../../../../error";
import { isFileExits, createDirectoryUri } from "../../../../../common/file";

/**
 * 校验指定路径是否存在，不存在进行创建
 * @param uri 
 */
export function imageStoreUriExits (uri: Uri): Promise<Uri> {
    return new Promise((resolve, reject) => {
        if (!uri) {
            return reject(new WError('Undefined Uri', {
                position: 'Parameter',
                FunctionName: imageStoreUriExits.name,
                ParameterName: 'uri'
            }));
        }
        isFileExits(uri).then(res => {
            if (!res) {
                // 文件夹不存在进行创建
                return createDirectoryUri(uri);
            }
        }).then(() => {
            resolve(uri);
        }).catch(err => {
            reject($rej(err, imageStoreUriExits.name));
        });
    });
}