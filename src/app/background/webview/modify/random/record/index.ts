/** @description webview侧设置随机背景图后的状态记录处理 */




/**
 * 记录随机设置背景图的相关数据，并更新状态
 * @param value 为false是关闭随机切换，为数组是打开随机切换，切换范围是数组内的图片
 * @param tip 是否弹出提示，如果是清除背景图配置，则不需要弹出提示
 */
export function randomSettingBackground (value: string[] | false, tip: boolean = true): void {
    if (value === false) {
        // 根据tip参数判断是否需要显示弹框提示
        Promise.resolve().then(() => {
            if (tip) {
                return showMessageByModal('是否关闭背景图随机切换？');
            }
        }).then(() => {
            showProgress({
                location: 'Notification',
                title: '正在关闭背景图随机切换'
            }, clearRandom.bind(null, tip));
        });
        return;
    }
    // value为字符串的情况
    if (value.length === 1) {
        showMessageWithConfirm('设置随机切换背景请选择两张以上图片');
        return;
    }
    showMessageByModal('是否设置背景图随机切换？每次打开软件会随机切换一张背景图。').then(() => {
        showProgress({
            location: 'Notification',
            title: '正在设置背景图随机切换'
        }, settingRandom.bind(null, value));
    });
}