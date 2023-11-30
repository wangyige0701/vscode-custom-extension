/** @description webview侧设置随机背景图处理 */




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

/** 开始设置随机背景图 */
export function settingRandom (value: string[], progress: TheProgress): Promise<void> {
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