/** @description 源css文件修改 */

import { getSourceCssFileContent } from "../getter";
import { isSourceCssFileModify } from "../check"; 


/**
 * 将导入语句写入主样式文件中
 * @param init 是否是初始化调用，初始化调用此方法为校验，不需要进行文件修改
 */
export function setSourceCssImportInfo (init: boolean = false) : Promise<{modify:boolean}> {
    return new Promise((resolve, reject) => {
        getSourceCssFileContent().then(data => {
            if (data) {
                // 有数据，进行修改
                return isSourceCssFileModify(...data);
            }
            // 没有数据返回false
            return Promise.reject({ jump: true, modify: false });
        }).then(({ content, uri, exits }) => {
            const nowDate = Date.now();
            let resContent: Buffer;
            if (exits === true) {
                // 修改过源文件需要更换路径后的时间戳，去除缓存
                if (init) {
                    // 源文件满足修改格式并且当前是初始化校验调用，则不进行文件改写并且通知外部函数当前未修改
                    return Promise.reject({ jump: true, modify: false });
                }
                // 不是初始化校验更新时间戳
                resContent = createBuffer(content.replace(findSourceCssVersionContentRegexp, `$1${nowDate}$3`));
            } else {
                // 没有修改过源文件直接修改
                resContent = createBuffer(`${importStart+'\n'
                    }@import url("./${externalFileName}?${nowDate}");${
                    '\n'+importEnd}`+content);
            }
            // 修改源文件并重置校验和
            return sourceCeeFileChangeChecksum(uri, resContent);
        }).then(() => {
            resolve({ modify: true });
        }).catch(err => {
            if (err.jump) {
                return resolve({ modify: err.modify });
            }
            reject($rej(err, setSourceCssImportInfo.name));
        });
    });
}

/**
 * 源css文件修改后重置校验和数据
 * @param uri 源文件的uri数据
 */
function sourceCeeFileChangeChecksum (uri: Uri, content: Uint8Array): Promise<void> {
    return new Promise((resolve, reject) => {
        writeFileUri(uri, content).then(() => {
            return reChecksum(uri);
        }).then(() => {
            resolve();
        }).catch(err => {
            reject($rej(err, sourceCeeFileChangeChecksum.name));
        });
    });
}