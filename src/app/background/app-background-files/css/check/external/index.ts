/** @description 校验储存背景图base64数据的外部css文件信息 */

import { getNowSettingCodeSync } from "../../../../app-background-workspace";
import { changeLoadStateToTrue } from "../../../../app-background-workspace";
import { checkIsSettingImage } from "../setting";
import { externalCssFileModify } from "../../setter";
import { $rej } from "../../../../../../error";

/** 
 * 校验外部设置背景样式css文件是否存在并且当前图片哈希码是否等于缓存中的哈希码
 */
export function checkExternalDataIsRight (): Promise<{
    modify: boolean;
}> {
    return new Promise((resolve, reject) => {
        const settingCode = getNowSettingCodeSync();
        if (settingCode === false) {
            changeLoadStateToTrue();
            return resolve({
                modify: false
            });
        }
        checkIsSettingImage(settingCode)
        .then(data => {
            return stateHandle(data.state, data.code);
        })
        .then(modify => {
            resolve({ modify });
        })
        .catch(err => {
            reject($rej(err, checkExternalDataIsRight.name));
        });
    });
}

/** 状态处理 */
function stateHandle (state: boolean, code?: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
        if (state === true) {
            // 当前不需要更新背景图css数据设置文件
            return resolve(false);
        }
        if (code) {
            // 哈希码校验失败或者没有css文件，重新写入
            await externalCssFileModify(code)
            .catch(reject);
            return resolve(true);
        }
        return resolve(true);
    });
}