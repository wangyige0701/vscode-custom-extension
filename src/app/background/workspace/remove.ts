/** @fileoverview 删除工作空间的哈希码配置数据 */

import { $rej } from "@/error";
import { BackgroundConfiguration } from "@/workspace";

/** 删除背景的缓存数据，将是否设置背景状态值改为false */
export function deleteConfiguration (): Promise<void> {
    return new Promise((resolve, reject) => {
        Promise.resolve(
            BackgroundConfiguration.setBackgroundNowImageCode("")
        ).then(() => {
            return Promise.resolve(
                BackgroundConfiguration.setBackgroundIsSetBackground(false)
            );
        }).then(() => {
            resolve();
        }).catch(err => {
            reject($rej(err, deleteConfiguration.name));
        });
    });
}
