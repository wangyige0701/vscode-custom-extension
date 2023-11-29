import { errlog } from "../../../error";
import { showMessageModal, selectFolderOnly } from "../../../common/interactive";
import { resetImageStorePath } from "./private/modify";

/** 选择文件夹作为背景图数据储存路径 */
export function selectFolderForBackgroundStore (): void {
    showMessageModal('是否修改背景图储存路径')
    .then(res => {
        if (res) {
            return selectFolderOnly('选择背景图储存文件夹');
        }
    }).then(data => {
        if (data) {
            return resetImageStorePath(data.dirName);
        }
    }).catch(err => {
        errlog(err, true);
    });
}

/** 重置背景图储存路径 */
export function resetBackgroundStorePath (): void {
    showMessageModal('是否重置背景图储存路径')
    .then(res => {
        if (res) {
            return resetImageStorePath('', true);
        }
    }).catch(err => {
        errlog(err, true);
    });
}