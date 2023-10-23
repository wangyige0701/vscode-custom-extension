import { errlog } from "../../error";
import { delay, getRandom } from "../../utils";
import { showMessageWithConfirm, showProgress } from "../../utils/interactive";
import { BackgroundConfiguration } from "../../workspace/background";
import { backgroundSendMessage } from "./executeWebview";
import { closeRandomBackground, showMessageByModal } from "./utils";
import { settingImage } from "./executeSetting";
import { modifyCssFileForBackground } from "./modify";
import type { Progress } from "vscode";

/**
 * 记录随机设置背景图的相关数据，并更新状态
 * @param value 为false是关闭随机切换，为数组是打开随机切换，切换范围是数组内的图片
 * @param tip 是否弹出提示，如果是清除背景图配置，则不需要弹出提示
 */
export function randomSettingBackground (value: string[] | false, tip: boolean = true): void {
    if (value === false) {
        // 根据tip参数判断是否需要显示弹框提示
        Promise.resolve().then(() => {
            if (tip) {
                return showMessageByModal('是否关闭背景图随机切换？');
            }
        }).then(() => {
            showProgress({
                location: 'Notification',
                title: '正在关闭背景图随机切换'
            }, clearRandom.bind(null, tip));
        });
        return;
    }
    // value为字符串的情况
    if (value.length === 1) {
        showMessageWithConfirm('设置随机切换背景请选择两张以上图片');
        return;
    }
    showMessageByModal('是否设置背景图随机切换？每次打开软件会随机切换一张背景图。').then(() => {
        showProgress({
            location: 'Notification',
            title: '正在设置背景图随机切换'
        }, settingRandom.bind(null, value));
    });
}

/** 随机设置下次的背景图 */
export function setRandomBackground (): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!BackgroundConfiguration.getBackgroundIsRandom) {
            return resolve();
        }
        /** 允许随机设置背景图的哈希码列表 */
        let list = BackgroundConfiguration.getBackgroundRandomList;
        // 当允许随机设置但是配置内的数组为空，则从所有图片中随机选择
        if (list.length <= 0) {
            list = BackgroundConfiguration.getBackgroundAllImageCodes;
        }
        // 当此时图片列表仍为空，则跳出方法
        if (list.length <= 0) {
            return resolve();
        }
        const code: string = list[getRandom(0, list.length)];
        settingImage({ code }, true).then(() => {
            resolve();
        }).catch((err) => {
            reject(err);
        });
    });
}

type TheProgress = Progress<{
    message?: string | undefined;
    increment?: number | undefined;
}>;

/** 关闭随机背景配置 */
function clearRandom (tip: boolean, progress: TheProgress): Promise<void> {
    return new Promise(resolve => {
        Promise.resolve().then(() => {
            if (!tip) {
                return;
            }
            const code: string = BackgroundConfiguration.getBackgroundNowImageCode;
            // 如果删除随机背景配置，则重置css文件中的背景图为当前选中背景；如果tip为false，则代表是清除所有配置，不需要再次修改
            if (code) {
                return modifyCssFileForBackground(code, false, false);
            }
        }).then(() => {
            progress.report({ increment: 33 });
            // 修改状态
            return Promise.resolve(
                BackgroundConfiguration.setBackgroundIsRandom(false)
            );
        }).then(() => {
            progress.report({ increment: 66 });
            // 清除随机背景图哈希码数据
            return Promise.resolve(
				BackgroundConfiguration.setBackgroundRandomCode('')
			);
        }).then(() => {
            progress.report({
                message: '关闭成功',
                increment: 100
            });
            closeRandomBackground(500);
            return delay(500);
        }).catch(err => {
            err && errlog(err);
        }).finally(() => {
            resolve();
        });
    });
}

/** 开始设置随机背景图 */
function settingRandom (value: string[], progress: TheProgress): Promise<void> {
    return new Promise(resolve => {
        Promise.resolve(
            BackgroundConfiguration.setBackgroundIsRandom(true)
        ).then(() => {
            progress.report({ increment: 33 });
            return Promise.resolve(
                BackgroundConfiguration.setBackgroundRandomList(value)
            );
        }).then(() => {
            progress.report({ increment: 66 });
            // 切换一张背景图，下次打开生效
            return setRandomBackground();
        }).then(() => {
            // 发送设置的数据
            backgroundSendMessage({
                name: 'backgroundRandomList',
                value
            });
            progress.report({
                message: '设置成功',
                increment: 100
            });
            return delay(500);
        }).then(() => {
            showMessageWithConfirm('设置完成，下次打开软件会随机切换背景图');
        }).catch(err => {
            err && errlog(err);
        }).finally(() => {
            resolve();
        });
    });
}