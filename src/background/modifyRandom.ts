import { errlog } from "../error";
import { getRandom } from "../utils";
import { setMessage } from "../utils/interactive";
import { backgroundImageConfiguration } from "../workspace/background";
import { backgroundSendMessage } from "./execute_webview";
import { closeRandomBackground, isChangeBackgroundImage } from "./utils";
import { settingImage } from "./execute_setting";

/**
 * 记录随机设置背景图的相关数据，并更新状态
 * @param value 
 * @param tip 是否弹出提示
 */
export function randomSettingBackground (value: string[] | false, tip: boolean = true) {
    if (value === false) {
        // 根据tip参数判断是否需要显示弹框提示
        Promise.resolve().then(() => {
            if (tip) 
                return isChangeBackgroundImage('是否关闭背景图随机切换？');
        }).then(() => {
             return backgroundImageConfiguration.setBackgroundIsRandom(false);
        }).then(() => {
            closeRandomBackground();
        }).catch(err => {
            errlog(err);
        });
        return;
    }
    if (value.length === 1) {
        setMessage({ message: '设置随机切换背景请选择两张以上图片' });
        return;
    }
    isChangeBackgroundImage('是否设置背景图随机切换？每次打开软件会随机切换一张背景图。').then(() => {
        return Promise.resolve(
            backgroundImageConfiguration.setBackgroundIsRandom(true)
        );
    }).then(() => {
        return Promise.resolve(
            backgroundImageConfiguration.setBackgroundRandomList(value)
        );
    }).then(() => {
        setMessage({ message: '设置完成，下次打开软件会随机切换背景图。' });
    }).then(() => {
        // 发送设置的数据
        backgroundSendMessage({
            name: 'backgroundRandomList',
            value
        });
        // 切换一张背景图，下次打开生效
        setRandomBackground();
    }).catch(err => {
        errlog(err);
    });
}

/**
 * 插件开启后随机设置下次的背景图
 * @returns 
 */
export function setRandomBackground () {
    if (!backgroundImageConfiguration.getBackgroundIsRandom())
        return;
    // 允许随机设置背景图
    let list = backgroundImageConfiguration.getBackgroundRandomList();
    // 当允许随机设置但是配置内的数组为空，则从所有图片中随机选择
    if (list.length <= 0) 
            list = backgroundImageConfiguration.getBackgroundAllImagePath();
    // 当此时图片列表仍为空，则跳出方法
    if (list.length <= 0) 
        return;
    const code: string = list[getRandom(0, list.length)];
    settingImage({ code }, true).catch((err) => {
        errlog(err);
    });
}