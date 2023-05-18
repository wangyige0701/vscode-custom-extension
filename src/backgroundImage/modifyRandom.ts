import { settingImage } from ".";
import { errHandle } from "../error";
import { getRandom } from "../utils";
import { setMessage } from "../utils/interactive";
import { backgroundImageConfiguration } from "../workspace/background";
import { isChangeBackgroundImage } from "./utils";

/**
 * 记录随机设置背景图的相关数据，并更新状态
 * @param value 
 */
export function randomSettingBackground (value: string[]) {
    isChangeBackgroundImage('是否设置背景图随机切换？每次打开软件会随机切换一张背景图。').then(res => {
        if (value.length <= 0) 
            value = backgroundImageConfiguration.getBackgroundAllImagePath();
        backgroundImageConfiguration.setBackgroundIsRandom(true)
            .then(() => {
                return backgroundImageConfiguration.setBackgroundRandomList(value);
            }, err => {
                errHandle(err);
            }).then(() => {
                setMessage({
                    message: '设置完成，下次打开软件会随机设置背景图。'
                });
            }, err => {
                errHandle(err);
            });
    }).catch(err => {
        errHandle(err);
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
    const list = backgroundImageConfiguration.getBackgroundRandomList();
    if (list.length <= 0) 
        return;
    const code: string = list[getRandom(0, list.length)];
    settingImage({ code }, true)!.catch((err) => {
        errHandle(err);
    });
}