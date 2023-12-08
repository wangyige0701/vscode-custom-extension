/** @fileoverview 图片base64数据和哈希码关联储存 */

import { hashCodeCache } from "./hashCodeCache";
import { RecordDataByMap } from "../../../utils/recordData/map";

var _cache: ImageDataCache;

class ImageDataCache extends RecordDataByMap<{ origin: string; thumbnail: string; }> {
    constructor () {
        super();
        _cache = this;
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
        hashCodeCache.clear();
    }
}

/** 图片数据储存对象 */
export const imageDataCache = new ImageDataCache();