import { request, get } from 'http';
import { RequestOptionsCustom, RequestUrl } from './main';

/**
 * Get请求
 * @param url 
 * @returns 
 */
function GetRequest (url: RequestUrl) {
    return new Promise((resolve, reject) => {
        get(url, (res) => {
            res.on('data', (chunk) => {
                resolve(chunk);
            });
            res.on('error', (err) => {
                reject(err);
            });
        });
    });
}

/**
 * Post请求
 * @param url 
 * @param options 
 * @returns 
 */
function PostRequest (url: RequestUrl, options: RequestOptionsCustom) {
    return new Promise((resolve, reject) => {
        RequestSend(url, Object.assign({
            method: 'post'
        }, options)).then(res => {
            resolve(res);
        }).catch(err => {
            reject(err);
        });
    });
}

/**
 * Request方法处理
 * @param url 
 * @param options 
 * @returns 
 */
function RequestSend (url: RequestUrl, options: RequestOptionsCustom) {
    return new Promise((resolve, reject) => {
        request(url, options, (res) => {
            res.on('data', (chunk) => {
                resolve(chunk);
            });
            res.on('error', (err) => {
                reject(err);
            });
        });
    });
}

export default {
    get: GetRequest,
    post: PostRequest
};