/** @description webview侧通过输入框添加网络图片处理模块 */





/**
 * 下载网络图片资源并发送至背景图列表
 * @param url 
 */
export function requestImageToBackground (url: string) {
    const sendMsg: string[] = [];
    getImageBase64ByRequest(url).then(data => {
        return addImageToStorage([data]);
    }).then(codes => {
        sendMsg.push(...codes);
    }).catch(err => {
        err && errlog(err);
    }).finally(() => {
        backgroundSendMessage({
            name: 'newImageNetwork',
            value: sendMsg
        });
    });
}

/**
 * 请求网络图片并转为base64数据
 * @param url 图片路径
 */
function getImageBase64ByRequest (url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const reg = url.match(imageUrl);
        if (!reg) {
            return reject({ warning: true, message: 'Illegal Image URL' });
        }
        GetImage(url).then(res => {
            return base64ByFiletypeAndData('image', imageToBase64Type(reg[2]), res);
        }).then(data => {
            resolve(data);
        }).catch(err => {
            if (err.warning) {
                showMessageWithConfirm(`${err.status??'Error'}: ${err.message??''} [ ${url} ]`, "error");
                return reject();
            }
            reject($rej(err, getImageBase64ByRequest.name));
        });
    });
}