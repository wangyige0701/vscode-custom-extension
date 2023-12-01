/** @description 图片base64数据和哈希码关联储存 */

import { backgroundHashCodes } from "../hash/hashCode";
import { RecordDataByMap } from "../../../../utils";

class ImageDataRepository extends RecordDataByMap<{ origin: string; thumbnail: string; }> {
    constructor () {
        super();
    }

    /** 缓存哈希码新增操作 */
    codeAdd (code: string, originData: string, thumbnailData: string): Promise<string> {
        this.set(code, {
            origin: originData??'',
            thumbnail: thumbnailData??''
        });
        return Promise.resolve(code);
    }

    /** 缓存哈希码删除操作 */
    codeDelete (code: string): Promise<string> {
        if (this.has(code)) {
            this.delete(code);
        }
        return Promise.resolve(code);
    }

    /** 
     * 获取缓存中的图片数据
     * @param code 哈希码
     * @param thumbnail 是否获取缩略图
     */
    getImageDataByCode (code: string, thumbnail: boolean = false): string {
        if (!this.has(code)) {
            return "";
        }
        const value = this.get(code);
        if (!thumbnail || (thumbnail && !value!.thumbnail)) {
            return value!.origin??"";
        }
        return value!.thumbnail??"";
    }

    /** 卸载前调用，清空缓存数据 */
    clearCache () {
        // 图片base64数据清除
        this.clear();
        // 图片哈希码数组清除
        backgroundHashCodes.clear();
    }
}

/** 图片数据储存对象 */
export const imageDataRepository = new ImageDataRepository();