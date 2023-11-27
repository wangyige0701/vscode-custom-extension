/**
 * 卸载时清除配置
 */

import { setWorkSpace } from "../workspace/main";
import { refreshVersion } from "./main";

const backgroundNamespace = 'wangyige.background';

function setConf (name: string, value: any) {
    return setWorkSpace(backgroundNamespace, name, value);
}

/** 卸载时调用 */
export function clearConfiguration (): Promise<void> {
    return new Promise((resolve, reject) => {
        Promise.resolve(
            setConf('allImageCodes', {})
        ).then(() => {
            return Promise.resolve(
                setConf('nowImageCode', "")
            );
        }).then(() => {
            return Promise.resolve(
                setConf('randomCode', "")
            );
        }).then(() => {
            return Promise.resolve(
                setConf('randomList', [])
            );
        }).then(() => {
            return refreshVersion('webview', true, true);
        }).then(() => {
            return refreshVersion('global', false, true);
        }).then(() => {
            resolve();
        }).catch(err => {
            reject(err);
        });
    });
}