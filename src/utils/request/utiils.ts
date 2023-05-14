import * as httpsRequest from "./https";
import * as httpRequest from "./http";
import { RequestUrl } from "./main";

/**
 * 请求http图片资源
 * @param url 
 * @returns 
 */
export function GetImageHttp (url: RequestUrl): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        httpRequest.default.get(url).then(res => {
            resolve(res as Uint8Array);
        }).catch(err => {
            reject(err);
        });
    });
}

/**
 * 请求https图片资源
 * @param url 
 * @returns 
 */
export function GetImageHttps (url: RequestUrl): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        httpsRequest.default.get(url).then(res => {
            resolve(res as Uint8Array);
        }).catch(err => {
            reject(err);
        });
    });
}