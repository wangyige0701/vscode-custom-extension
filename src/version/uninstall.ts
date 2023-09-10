/**
 * 卸载时清除配置
 */

import { errlog } from "../error";
import { BackgroundConfiguration } from "../workspace/background";
import { refreshVersion } from "./utils";

/** 卸载时调用 */
export function clearConfiguration () {
    return new Promise((resolve, reject) => {
        Promise.resolve(
            BackgroundConfiguration.refreshBackgroundImagePath([])
        ).then(() => {
            return Promise.resolve(
                BackgroundConfiguration.setBackgroundNowImageCode("")
            );
        }).then(() => {
            return Promise.resolve(
                BackgroundConfiguration.setBackgroundRandomCode("")
            );
        }).then(() => {
            return Promise.resolve(
                BackgroundConfiguration.setBackgroundRandomList([])
            );
        }).then(() => {
            return Promise.resolve(
                BackgroundConfiguration.setBackgroundStorePath("")
            );
        }).then(() => {
            return refreshVersion('webview', true, true);
        }).then(() => {
            return refreshVersion('global', false, true);
        }).catch(err => {
            errlog(err);
        });
    });
}