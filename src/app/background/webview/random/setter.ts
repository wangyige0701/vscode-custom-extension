/** @fileoverview webview侧设置随机背景图处理 */

import { getNowIsSetRandom, getRandomList, getAllImageHashCodes } from "../../workspace/getter";
import { getRandom } from "../../../../utils";
import { settingImage } from "../../image/operate/setting";

/** 随机设置下次的背景图 */
export function setRandomBackground (): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!getNowIsSetRandom()) {
            return resolve();
        }
        /** 允许随机设置背景图的哈希码列表 */
        const list = getRandomList();
        // 当允许随机设置但是配置内的数组为空，则从所有图片中随机选择
        if (list.length === 0) {
            list.push(...getAllImageHashCodes());
        }
        // 当此时图片列表仍为空，则跳出方法
        if (list.length === 0) {
            return resolve();
        }
        const code = list[getRandom(0, list.length)];
        settingImage({ code }, true)
        .then(resolve)
        .catch(reject);
    });
}