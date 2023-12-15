/** @description vscode插件初始化时检测 */

import { errlog } from "@/error";
import { isWindowReloadToLoadBackimage } from "@background/common/interactive";
import { checkImageCssDataIsRight } from "./run";

/** vscode初始化后检测背景配置是否完整 */
export async function windowInitCheckCssModifyCompleteness () {
    // 检查css文件是否正确
	const state = await checkImageCssDataIsRight()
    .catch(err => {
        errlog(err);
	});
    if (state) {
        // 需要重启应用背景
        isWindowReloadToLoadBackimage('检测到背景图配置修改或删除，当前状态可能为插件重装，如果需要重新应用背景请选择确认重启窗口');
    }
}
