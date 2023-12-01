/** @description 校验储存背景图base64数据的外部css文件信息 */

import { getNowSettingCodeSync } from "../../../../app-background-workspace";
import { changeLoadState } from "../../../../app-background-common";
import { checkIsSettingImage } from "../setting";

/** 校验外部设置背景样式css文件是否存在并且当前图片哈希码是否等于缓存中的哈希码 */
export function checkExternalDataIsRight (): Promise<{
    modify: boolean;
}> {
    return new Promise((resolve, reject) => {
        const settingCode = getNowSettingCodeSync();
        if (settingCode === false) {
            changeLoadState();
            return resolve({
                modify: false
            });
        }
        checkIsSettingImage(settingCode)
        .then(data => {
            if (data.state === true) {
                // 当前不需要更新背景图css数据设置文件
                return Promise.reject({ jump: true, modify: false });
            }
            if (data.code) {
                // 哈希码校验失败或者没有css文件，重新写入
                return externalCssFileModify(data.code);
            }
            return Promise.reject({ jump: true, modify: true });
        }).then(() => {
            resolve({ modify:true });
        }).catch(err => {
            if (err.jump) {
                return resolve({ modify: err.modify });
            }
            reject($rej(err, checkExternalDataIsRight.name));
        });
    });
}