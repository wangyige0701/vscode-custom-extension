/** @description webview侧通过输入框修改背景图透明度处理模块 */



/**
 * 修改背景图透明度
 * @param opacity 透明度数据
 */
export function backgroundOpacityModify (opacity: number) {
    let sendOpacity: number = BackgroundConfiguration.getBackgroundOpacity;
    changeBackgroundFileOpacity(opacity).then(state => {
        if (state) {
            sendOpacity = opacity;
            isWindowReloadToLoadBackimage('透明度设置完成，是否重启窗口应用');
            return Promise.resolve(BackgroundConfiguration.setBackgroundOpacity(opacity));
        }
        // state为false，和当前透明度相同，不进行修改
        showMessageWithConfirm(`当前透明度已为${opacity}，若需修改，请输入0.1~1间的任意数字`);
    }).catch(err => {
        errlog(err);
    }).finally(() => {
        // 发送通信，返回设置好的透明度，并关闭按钮加载状态
        backgroundSendMessage({
            name: 'nowBackgroundOpacity',
            value: sendOpacity
        });
    });
}

/**
 * 将透明度重新写入外部css文件
 * @param opacity 
 */
function changeBackgroundFileOpacity (opacity: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
        if (opacity === BackgroundConfiguration.getBackgroundOpacity) {
            return resolve(false);
        }
        getExternalFileContent().then(data => {
            const content = replaceExternaOpacityContent(data[0], getNewBackgroundOpacity(opacity));
            return writeExternalCssFile(content);
        }).then(() => {
            return setSourceCssImportInfo();
        }).then(() => {
            resolve(true);
        }).catch(err => {
            reject($rej(err, changeBackgroundFileOpacity.name));
        });
    });
}