/** @description 背景图片删除模块 */

import { hasHashCode } from "../../cache";

/**
 * 删除一张图片，不需要判断是否被设置了背景图，图片被删除后背景图样式保持，直到下一次重新设置
 * @param messageSend 
 * @param webview 
 * @param code 
 */
export function deleteImage (...code: string[]) {
    showMessageByModal(code.length > 1 ? '是否删除选中图片' : '是否删除此图片').then(() => {
        return Promise.resolve(deleteImageProgress(...code));
    }).catch(err => {
        err && errlog(err);
    });
}

/** 图片删除的进度条 */
function deleteImageProgress (...codes: string[]) {
    return showProgress({
        location: 'Notification',
        title: '图片删除中'
    }, (progress) => <Promise<void>>new Promise(resolve => {
        Promise.all(codes.map(code => {
            return deleteFileStore(code);
        })).then(codes => {
            const randomList = BackgroundConfiguration.getBackgroundRandomList;
            for (const code of codes) {
                // 删除随机数组缓存的数据
                if (randomList.includes(code)) {
                    randomList.splice(randomList.indexOf(code), 1);
                }
                // 删除缓存数组内的数据
                if (hasHashCode(code)) {
                    backgroundImageCodeArray.splice(backgroundImageCodeArray.indexOf(code), 1);
                }
            }
            return createExParamPromise(
                Promise.all([
                    Promise.resolve(BackgroundConfiguration.setBackgroundRandomList(randomList)),
                    BackgroundConfiguration.refreshBackgroundImagePath(backgroundImageCodeArray)
                ]),
                codes
            );
        }).then(([_, codes]) => {
            refreshImageCodeList();
            // 发送数据
            backgroundSendMessage({
                name: 'deleteImageSuccess',
                value: codes
            });
            progress.report({
                message: '删除成功',
                increment: 100
            });
            // 延迟关闭进度条
            return delay(1500);
        }).catch(err => {
            errlog(err);
        }).finally(() => {
            resolve();
        });
    }));
}