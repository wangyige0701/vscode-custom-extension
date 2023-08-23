import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

/**
 * axios请求状态处理
 * @param data 
 * @returns 
 */
function resultHandle (data: AxiosResponse): Promise<AxiosResponse> {
    return new Promise((resolve, reject) => {
        if (!data) reject(new Error('Null Resoponse'));
        if (data.status < 300) {
            resolve(data);
        } else {
            reject(data);
        }
    });
}

/**
 * Get请求
 * @param url 
 * @param options 
 * @returns 
 */
function get (url: string, options?: AxiosRequestConfig): Promise<AxiosResponse> {
    return new Promise((resolve, reject) => {
        axios.get(url, Object.assign({
            timeout: 10*1000
        }, options??{})).then(res => {
            return resultHandle(res);
        }).then(res => {
            resolve(res);
        }).catch(err => {
            reject(new Error('Axios Get Request Error', { cause: err }));
        });
    });
}

/**
 * Post请求
 * @param url 
 * @param data 
 * @param options 
 * @returns 
 */
function post (url: string, data: any, options?: AxiosRequestConfig): Promise<AxiosResponse> {
    return new Promise((resolve, reject) => {
        axios.post(url, data, Object.assign({
            timeout: 10*1000
        }, options??{})).then(res => {
            return resultHandle(res);
        }).then(res => {
            resolve(res);
        }).catch(err => {
            reject(new Error('Axios Post Request Error', { cause: err }));
        });
    });
}

export default {
    get,
    post
}