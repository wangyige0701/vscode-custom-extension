import type { ImageCodes, Res, Rej, SetCodesQueue } from "./types/background";
import { getWorkSpace, setWorkSpace } from ".";
import { isFunction, isString, cryHex } from "../utils";
import { joinPathUri, isFileExitsSync } from "../common/file";
import { ExtensionUri } from "../common/system";

/** 背景图片默认存储路径 */
export const defaultPath = ['resources', 'background'];

/** 背景图配置项实例 */
export class BackgroundConfiguration {
    /** 命名空间 */
    static namespace = 'wangyige.background';

    static queue: SetCodesQueue[] = [];

    static isQueueExecute: boolean = false;

    /** 插入队列 */
    private static queueSet (func: () => Promise<void>, resolve?: Res, reject?: Rej) {
        if (isFunction(func) && (!resolve || isFunction(resolve)) && (!reject || isFunction(reject))) {
            this.queue.push({ func, resolve, reject });
        }
        if (!this.isQueueExecute) {
            this.queueExecute();
        }
    }

    /** 队列执行 */
    private static queueExecute () {
        if (this.queue.length <= 0) {
            this.isQueueExecute = false;
            return;
        }
        this.isQueueExecute = true;
        const target = this.queue.shift();
        if (!target) {
            this.queueExecute();
            return;
        }
        const { func, resolve, reject } = target;
        func()
            .then(resolve)
            .catch(reject)
            .finally(() => {
                this.queueExecute();
            });
    }

    /** 获取背景图配置信息 */
    private static getBackgroundConfiguration (name: string): any {
        return getWorkSpace(this.namespace).get<any>(name);
    }

    /**
     * 更新背景图配置信息
     * @param name 
     * @param value 
     */
    private static setBackgroundConfiguration (name: string, value: any): Thenable<void> {
        return setWorkSpace(this.namespace, name, value);
    }

    /** 获取默认储存路径 */
    static get getDefaultPath (): [string, string] {
        const path = joinPathUri(ExtensionUri.get, ...defaultPath).fsPath;
        return [cryHex(path), path];
    }

    /** 获取当前储存路径，如果有则返回哈希值 */
    private static get getSettingStorePath (): [string, string] | undefined {
        const path = this.getBackgroundStorePath;
        if (path) {
            return [cryHex(path), path];
        } else {
            return void 0;
        }
    }

    /** 获取所有选择的图片哈希值数据 */
    static get getBackgroundAllImageCodes (): string[] {
        const [hash, path] = this.getSettingStorePath??this.getDefaultPath,
        data = this.getBackgroundAllImageObject;
        // 没有对应属性则新创建一个
        if (!data.hasOwnProperty(hash)) {
            data[hash] = { path, value: [] };
        }
        return data[hash].value;
    }

    /**
     * 设置当前路径下的哈希码数组缓存
     * @param value 
     */
    private static setBackgroundAllImageObject (value: string[]): Promise<void> {
        return new Promise((resolve, reject) => {
            // 获取路径哈希码和具体数据
            const [hash, path] = this.getSettingStorePath??this.getDefaultPath,
            /** 获取当前储存的图片数据 */
            data = this.getBackgroundAllImageObject,
            // 整理数据，去除没有数据的索引
            result: { [key: string]: ImageCodes } = {};
            if (value.length > 0) {
                result[hash] = { path, value };
            }
            for (const hashName in data) {
                if (data[hashName] && data[hashName].value.length > 0 && hashName !== hash) {
                    result[hashName] = data[hashName];
                }
            }
            this.queueSet(() => Promise.resolve(
                this.setBackgroundConfiguration('allImageCodes', result)
            ), resolve, reject);
        });
    }

    /**
     * 更新图片哈希值数组数据
     * @param value 添加或删除的图片哈希码，如果删除某条数据可以直接传对应索引
     * @param state 添加：add, 删除：delete
     */
    static async setBackgroundAllImageCodes (value: string | number, state: 'add' | 'delete' = 'add'): Promise<void> {
        const list: string[] = this.getBackgroundAllImageCodes;
        if (state === 'add' && isString(value)) {
            // 添加一个图片数据
            list.unshift(value);
        } else if (state === 'delete') {
            if (isString(value)) {
                value = list.findIndex(item => item === value);
            }
            if (value < 0) {
                return Promise.resolve();
            }
            list.splice(value, 1);
        }
        await this.setBackgroundAllImageObject(list).then(() => {
            return Promise.resolve();
        }).catch(err => {
            return Promise.reject(err);
        });
    }

    /** 检测数据路径是否存在 */
    static check () {
        const [hash] = this.getSettingStorePath??this.getDefaultPath,
        /** 获取当前储存的图片数据 */
        data = this.getBackgroundAllImageObject,
        // 整理数据，去除没有数据的索引
        result: { [key: string]: ImageCodes } = {};
        for (const hashName in data) {
            const target = data[hashName];
            // 没有path数据进入下一次循环
            if (!target.hasOwnProperty('path')) {
                continue;
            }
            // 没有value为空数组
            if (!target.hasOwnProperty('value')) {
                target.value = [];
            }
            if (hash !== hashName) {
                const thePath = target.path;
                // 路径不存在跳过进入下一次循环
                if (!thePath || !isFileExitsSync(thePath)) {
                    continue;
                }
            }
            result[hashName] = target;
        }
        // 插入队列执行
        this.queueSet(() => Promise.resolve(
            this.setBackgroundConfiguration('allImageCodes', result)
        ));
    }

    /** 获取所有图片哈希码数组的储存数据 */
    private static get getBackgroundAllImageObject(): { [key: string]: ImageCodes } {
        return this.getBackgroundConfiguration('allImageCodes');
    }

    /**
     * 更新图片数组数据
     * @param value 
     */
    static refreshBackgroundImagePath (value: string[]): Promise<void> {
        // 只更新对应属性的数据
        return this.setBackgroundAllImageObject(value);
    }

    /** 是否设置了背景图 */
    static get getBackgroundIsSetBackground (): boolean {
        return this.getBackgroundConfiguration('isSetBackground');
    }

    /**
     * 是否设置了背景图状态修改
     * @param value 
     */
    static setBackgroundIsSetBackground (value: boolean): Thenable<void> {
        return this.setBackgroundConfiguration('isSetBackground', value);
    }

    /** 当前选中的图片哈希值 */
    static get getBackgroundNowImageCode (): string {
        return this.getBackgroundConfiguration('nowImageCode');
    }

    /**
     * 当前选中图片哈希值数据更新
     * @param value 
     */
    static setBackgroundNowImageCode (value: string): Thenable<void> {
        return this.setBackgroundConfiguration('nowImageCode', value);
    }

    /** 当前背景透明度 */
    static get getBackgroundOpacity (): number {
        return this.getBackgroundConfiguration('opacity');
    }

    /**
     * 背景透明度数据更新
     * @param value 
     */
    static setBackgroundOpacity (value: number): Thenable<void> {
        return this.setBackgroundConfiguration('opacity', value);
    }

    /** 当前选择文件默认路径 */
    static get getBackgroundSelectDefaultPath (): string {
        return this.getBackgroundConfiguration('defaultPath');
    }

    /**
     * 设置默认路径
     * @param value 
     */
    static setBackgroundSelectDefaultPath (value: string): Thenable<void> {
        return this.setBackgroundConfiguration('defaultPath', value);
    }

    /** 获取背景图加载状态 */
    static get getBackgroundLoad (): boolean {
        return this.getBackgroundConfiguration('load');
    }

    /**
     * 设置背景图加载状态
     * @param value 
     */
    static setBackgroundLoad (value: boolean): Thenable<void> {
        return this.setBackgroundConfiguration('load', value);
    }

    /** 获取当前背景图储存路径 */
    static get getBackgroundStorePath (): string {
        return this.getBackgroundConfiguration('storePath');
    }

    /**
     * 设置背景图储存路径
     * @param value 
     */
    static setBackgroundStorePath (value: string): Thenable<void> {
        return this.setBackgroundConfiguration('storePath', value);
    }

    /** 获取是否开启了随机切换背景图状态 */
    static get getBackgroundIsRandom (): boolean {
        return this.getBackgroundConfiguration('isRandom');
    }

    /**
     * 设置是否开启了随机切换背景图状态
     * @param value 
     */
    static setBackgroundIsRandom (value: boolean): Thenable<void> {
        return this.setBackgroundConfiguration('isRandom', value);
    }

    /** 获取随机切换的背景图哈希码数组 */
    static get getBackgroundRandomList (): string[] {
        return this.getBackgroundConfiguration('randomList');
    }

    /**
     * 设置随机切换的背景图哈希码数组
     * @param value 
     */
    static setBackgroundRandomList (value: string[]): Thenable<void> {
        return this.setBackgroundConfiguration('randomList', value);
    }

    /** 获取下一次启动时随机切换的图片哈希码 */
    static get getBackgroundRandomCode (): string {
        return this.getBackgroundConfiguration('randomCode');
    }

    /**
     * 设置下一次启动时随机切换的图片哈希码
     * @param value 
     */
    static setBackgroundRandomCode (value: string): Thenable<void> {
        return this.setBackgroundConfiguration('randomCode', value);
    }
}

// 执行数据校验
BackgroundConfiguration.check();