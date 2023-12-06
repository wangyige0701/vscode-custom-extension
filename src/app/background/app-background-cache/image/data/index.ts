/** @description 图片base64数据和哈希码关联储存 */

import type { Uri } from "vscode";
import { backgroundHashCodes as hashCodeArray } from "../../hash/data";
import { RecordDataByMap, createExParamPromise } from "../../../../../utils";
import { getCompressImage } from "../../../app-background-files";

var _cache: ImageDataRepository;

class ImageDataRepository extends RecordDataByMap<{ origin: string; thumbnail: string; }> {
    constructor () {
        super();
        _cache = this;
    }

    /** 缓存哈希码新增操作 */
    codeAdd (code: string, originData: string, thumbnailData: string): Promise<string> {
        _cache.set(code, {
            origin: originData??'',
            thumbnail: thumbnailData??''
        });
        return Promise.resolve(code);
    }

    /** 缓存哈希码删除操作 */
    codeDelete (code: string): Promise<string> {
        if (_cache.has(code)) {
            _cache.delete(code);
        }
        return Promise.resolve(code);
    }

    /** 缓存哈希码检查操作 */
    codeCheck (code: string, data: string, uri: Uri): Promise<{
        code: string; 
        exist: boolean;
    }> {
        return new Promise((resolve, reject) => {
            getCompressImage(code, data, uri)
            .then(({ data: $data }) => {
                let exist = true;
                if (hashCodeArray.indexOf(code) < 0) {
                    // 缓存数组中不存在，需要添加
                    exist = false;
                }
                return createExParamPromise(_cache.codeAdd(code, data, $data), exist);
            })
            .then(([$code, exist]) => {
                resolve({ code: $code, exist });
            })
            .catch(reject);
        });
    }

    /** 
     * 获取缓存中的图片数据
     * @param code 哈希码
     * @param thumbnail 是否获取缩略图
     */
    getImageDataByCode (code: string, thumbnail: boolean = false): string {
        if (!_cache.has(code)) {
            return "";
        }
        const value = _cache.get(code);
        if (!thumbnail || (thumbnail && !value!.thumbnail)) {
            return value!.origin??"";
        }
        return value!.thumbnail??"";
    }

    /** 卸载前调用，清空缓存数据 */
    clearCache () {
        // 图片base64数据清除
        _cache.clear();
        // 图片哈希码数组清除
        hashCodeArray.clear();
    }
}

/** 图片数据储存对象 */
export const imageDataRepository = new ImageDataRepository();