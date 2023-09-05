import { Uri } from "vscode";
import { createExParamPromise, range } from "..";
import { errlog } from "../../error";
import { cryHex } from "../hash";
import { checksumsMap, ChecksumsState } from "./data";
import { getChecksumsData, getFullPathOfChecksum } from "./utils";
import { modifyChecksum } from "./modify";

/** 校验和相关数据初始化 */
export function checksumsInit () {
    if (ChecksumsState.isInitial()) {
        return;
    }
    getChecksumsData().then(data => {
        const paths = data.map(item => item.path);
        const hashs = data.map(item => item.hash);
        return createExParamPromise(getFullPathOfChecksum(paths), paths, hashs);
    }).then(([paths, originpaths, hashs]) => {
        for (const i of range(paths.length)) {
            const path = paths[i];
            checksumsMap.set(cryHex(path), {
                path,
                value: hashs[i],
                regexp: new RegExp(`(^[\\w\\W]*"${originpaths[i]}"\\s*:\\s*")([^"]*)("[\\w\\W]*$)`),
                reset (content: string, hash: string) {
                    return content.replace(this.regexp, (_, $1, $2, $3) => `${$1}${hash}${$3}`);
                }
            });
        }
    }).then(() => {
        // 将状态置为true
        ChecksumsState.change(true).initial();
    }).catch(err => {
        errlog(err);
    });
}

/** 重新检测指定目录文件 */
export function reChecksum (path: Uri): Promise<void> {
    if (ChecksumsState.isInitial() && ChecksumsState.get() && path) {
        return modifyChecksum(path);
    }
    return Promise.resolve();
}