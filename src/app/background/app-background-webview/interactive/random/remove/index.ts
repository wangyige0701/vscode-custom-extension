/** @description webview侧关闭随机背景图设置的处理 */





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