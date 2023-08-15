import request from ".";

/**
 * 请求图片资源
 * @param url 
 * @returns 
 */
export function GetImage (url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        request.get(url, {
            responseType: 'arraybuffer'
        }).then(res => {
            resolve(res.data);
        }).catch(err => {
            reject(new Error('Error when request Image Data', { cause: err }));
        });
    });
}