/** @description 设置工作空间配置的背景图哈希码数据 */



/**
 * 设置当前背景哈希码缓存，将是否设置背景状态值改为true
 * @param options 
 * @param random 是否是随机切换背景图方法内调用
 */
function settingConfiguration (options: info, random: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!options) {
            return resolve();
        }
        Promise.resolve(
            BackgroundConfiguration.setBackgroundIsSetBackground(true)
        ).then(() => {
            // 当不是随机切换时，将code存入当前图片缓存，否则存入随机切换图片缓存
            if (!random) {
                return Promise.resolve(
                    BackgroundConfiguration.setBackgroundNowImageCode(options.ImageCode)
                );
            }
            return Promise.resolve(
                BackgroundConfiguration.setBackgroundRandomCode(options.ImageCode)
            );
        }).then(() => {
            resolve();
        }).catch(err => {
            reject($rej(err, settingConfiguration.name));
        });
    });
}