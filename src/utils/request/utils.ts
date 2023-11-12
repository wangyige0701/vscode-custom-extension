import request from "./main";

/**
 * 请求图片资源
 * @param url 
 */
export function GetImage (url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        request.get(url, {
            responseType: 'arraybuffer'
        }).then(res => {
            resolve(res.data);
        }).catch(err => {
            const { cause: { response: { status }, message } } = err;
            if (status) {
                return reject({ status, warning: true, message });
            }
            reject(new Error('Error when request Image Data', { cause: err }));
        });
    });
}