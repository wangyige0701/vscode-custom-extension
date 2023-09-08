import { errlog } from "../../error";
import { getRandom } from "../../utils";
import { showMessage } from "../../utils/interactive";
import { BackgroundConfiguration } from "../../workspace/background";
import { backgroundSendMessage } from "./execute_webview";
import { closeRandomBackground, showMessageByModal } from "./utils";
import { settingImage } from "./execute_setting";
import { modifyCssFileForBackground } from "./modify";

/**
 * 记录随机设置背景图的相关数据，并更新状态
 * @param value 为false是关闭随机切换，为数组是打开随机切换，切换范围是数组内的图片
 * @param tip 是否弹出提示
 */
export function randomSettingBackground (value: string[] | false, tip: boolean = true): void {
    if (value === false) {
        // 根据tip参数判断是否需要显示弹框提示
        Promise.resolve().then(() => {
            if (tip) {
                return showMessageByModal('是否关闭背景图随机切换？');
            }
        }).then(() => {
            let code: string = '';
            // 如果删除随机背景配置，则重置css文件中的背景图为当前背景；如果tip为false，则代表是清除所有配置，不需要再次修改
            if (tip && (code = BackgroundConfiguration.getBackgroundNowImageCode)) {
                return modifyCssFileForBackground(code, false, false);
            }
        }).then(() => {
            // 修改状态
            return Promise.resolve(
                BackgroundConfiguration.setBackgroundIsRandom(false)
            );
        }).then(() => {
            // 清除随机背景图哈希码数据
            return Promise.resolve(
				BackgroundConfiguration.setBackgroundRandomCode('')
			);
        }).then(() => {
            closeRandomBackground();
        }).catch(err => {
            err && errlog(err);
        });
        return;
    }
    // value为字符串的情况
    if (value.length === 1) {
        showMessage({ message: '设置随机切换背景请选择两张以上图片' });
        return;
    }
    showMessageByModal('是否设置背景图随机切换？每次打开软件会随机切换一张背景图。').then(() => {
        return Promise.resolve(
            BackgroundConfiguration.setBackgroundIsRandom(true)
        );
    }).then(() => {
        return Promise.resolve(
            BackgroundConfiguration.setBackgroundRandomList(value)
        );
    }).then(() => {
        // 切换一张背景图，下次打开生效
        return setRandomBackground();
    }).then(() => {
        showMessage({ message: '设置完成，下次打开软件会随机切换背景图' });
    }).then(() => {
        // 发送设置的数据
        backgroundSendMessage({
            name: 'backgroundRandomList',
            value
        });
    }).catch(err => {
        err && errlog(err);
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