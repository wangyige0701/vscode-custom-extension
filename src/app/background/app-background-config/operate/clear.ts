/** @description 清除所有背景图配置 */

/** 清除背景图相关设置 */
export function clearBackgroundConfig () {
    showMessageByModal('是否清除背景图配置').then(() => {
        const nowCode = BackgroundConfiguration.getBackgroundNowImageCode;
        if (nowCode) {
            // 发送settingBackgroundSuccess数据通知webview侧关闭当前图片的选中样式
            backgroundSendMessage({
                name: 'settingBackgroundSuccess',
                value: nowCode
            });
        }
    }).then(() => {
        return Promise.resolve(
            clearBackgroundConfigExecute()
        );
    }).then(() => {
        if (BackgroundConfiguration.getBackgroundIsRandom) {
            // 如果当前设置了随机切换，需要关闭
            randomSettingBackground(false, false);
        }
    }).catch(err => {
        err && errlog(err);
    });
}

/** 执行配置清除方法 */
export function clearBackgroundConfigExecute () {
    return showProgress({
        location: 'Notification',
        title: '清除中'
    }, (progress) => <Promise<void>>new Promise(resolve => {
        deleteBackgroundCssFileModification().then(() => {
            progress.report({
                message: '清除成功',
                increment: 100
            });
            return delay(500);
        }).then(() => {
            isWindowReloadToLoadBackimage("背景图配置清除成功，是否重启窗口");
        }).catch(err => {
            return Promise.reject(err);
        }).finally(() => {
            resolve();
        });
    }));
}