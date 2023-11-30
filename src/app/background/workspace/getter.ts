/** @description 工作空间数据获取 */



/** 获取缓存中的当前设置的背景图哈希码数据，如果没有缓存数据，返回false */
function getNowSettingCode (): Promise<string | false> {
    return new Promise((resolve, reject) => {
        Promise.resolve().then(() => {
            const storageCode = BackgroundConfiguration.getBackgroundNowImageCode;
            if (storageCode) {
                return resolve(storageCode);
            }
            resolve(false);
        }).catch(err => {
            reject($rej(err, getNowSettingCode.name));
        });
    });
}