import type { Uri } from "vscode";
import { $rej } from "@/error";
import { createExParamPromise, cryHex } from "@/utils";
import { checksumsMap } from "./checksumsRecord";
import { getProductRoot, getProductFileName, computeFileChecksums } from "./utils";
import { createBuffer, createUri, readFileUri, writeFileUri } from "../../file";

/**
 * 修改校验和数据
 * @param path 修改文件的路径Uri数据
 */
export function modifyChecksum (path: Uri): Promise<void> {
    return new Promise((resolve, reject) => {
        // 判断
        const pathHash = cryHex(path.toString());
        Promise.resolve(checksumsMap.has(pathHash))
        .then(state => {
            if (state) {
                return createNewChecksum(path);
            }
        })
        .then(checksum => {
            if (checksum && !checksumsMap.same(pathHash, checksum)) {
                // 更新校验和的哈希值
                return modifySourceFile(pathHash, checksum);
            }
        })
        .then(resolve)
        .catch(err => {
            reject($rej(err, modifyChecksum.name));
        });
    });
}

/** 生成指定文件校验和哈希值 */
function createNewChecksum (path: Uri): Promise<string> {
    return new Promise((resolve, reject) => {
        readFileUri(path)
        .then(fileContent => {
            return computeFileChecksums(fileContent.toString());
        })
        .then(resolve)
        .catch(reject);
    });
}

/** 更改源文件 */
function modifySourceFile (pathHash: string, value: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const uri = createUri(getProductFileName(getProductRoot()));
        createExParamPromise(readFileUri(uri), uri)
        .then(([fileContent, uri]) => {
            return createExParamPromise(Promise.resolve(checksumsMap.get(pathHash)!.reset(fileContent.toString(), value)), uri);
        })
        .then(([result, uri]) => {
            return writeFileUri(uri, createBuffer(result));
        })
        .then(() => {
            checksumsMap.update(pathHash, value);
        })
        .then(resolve)
        .catch(reject);
    });
}
