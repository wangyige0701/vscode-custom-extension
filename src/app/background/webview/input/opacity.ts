/** @fileoverview webview侧通过输入框修改背景图透明度处理模块 */

import { errlog } from "@/error";
import { showMessageWithConfirm } from "@/common/interactive";
import { settingOpacity } from "@background/workspace/setter";
import { getNewBackgroundOpacity } from "@background/common/func";
import { getNowSettingOpacity } from "@background/workspace/getter";
import { setSourceCssImportInfo } from "@background/css/setter/source";
import { externalCssFileWrite } from "@background/css/setter/external";
import { getExternalCssFileContent } from "@background/css/getter/external";
import { isWindowReloadToLoadBackimage } from "@background/common/interactive";
import { replaceExternaOpacityContent } from "@background/data/css/opacityReplace";
import { sendSettingOpacity } from "../communication/send";

/**
 * 修改背景图透明度
 * @param opacity 透明度数据
 */
export function backgroundOpacityModify (opacity: number) {
    let sendOpacity = getNowSettingOpacity();
    changeBackgroundFileOpacity(opacity)
    .then(state => {
        if (state) {
            sendOpacity = opacity;
            isWindowReloadToLoadBackimage('透明度设置完成，是否重启窗口应用');
            return Promise.resolve(settingOpacity(opacity));
        }
        // state为false，和当前透明度相同，不进行修改
        showMessageWithConfirm(`当前透明度已为${opacity}，若需修改，请输入0.1~1间的任意数字`);
    })
    .catch(errlog)
    .finally(() => {
        // 发送通信，返回设置好的透明度，并关闭按钮加载状态
        sendSettingOpacity(sendOpacity);
    });
}

/**
 * 将透明度重新写入外部css文件
 * @param opacity
 */
function changeBackgroundFileOpacity (opacity: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
        if (opacity === getNowSettingOpacity()) {
            return resolve(false);
        }
        getExternalCssFileContent()
        .then(data => {
            const content = replaceExternaOpacityContent(data[0], getNewBackgroundOpacity(opacity));
            return externalCssFileWrite(content);
        })
        .then(() => {
            return setSourceCssImportInfo();
        })
        .then(() => {
            resolve(true);
        })
        .catch(reject);
    });
}
