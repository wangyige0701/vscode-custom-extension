import { errlog } from "../error";
import { selectFile, setMessage } from "../utils/interactive";
import { resetImageStorePath } from "./utils";

/**
 * 选择文件夹作为背景图数据储存路径
*/
export function selectFolderForBackgroundStore (): void {
    setMessage({
        message: '提示',
        modal: true,
        detail: '是否修改背景图储存路径',
        items: [{
            title: '确认'
        }]
    }).then(res => {
        if (res) return selectFile({
            files: false,
            folders: true,
            title: '选择背景图储存文件夹'
        });
    }).then(data => {
        if (data) return resetImageStorePath(data.dirName);
    }).catch(err => {
        errlog(err, true);
    });
}

/**
 * 重置背景图储存路径
 */
export function resetBackgroundStorePath (): void {
    setMessage({
        message: '提示',
        modal: true,
        detail: '是否重置背景图储存路径',
        items: [{
            id: 0,
            title: '确认'
        }]
    }).then(res => {
        if (res) return resetImageStorePath('', true);
    }).catch(err => {
        errlog(err, true);
    });
}