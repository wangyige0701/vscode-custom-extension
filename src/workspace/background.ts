import { getWorkSpace, setWorkSpace } from ".";
import { isString } from "../utils";
import { joinPathUri } from "../utils/file";
import { cryHex } from '../utils/hash';
import { contextContainer } from "../utils/webview";

/** 背景图片默认存储路径 */
export const defaultPath = ['resources', 'background'];

/** 背景图配置项对象 */
export class BackgroundConfiguration {
    /** 命名空间 */
    static namespace = 'wangyige.background';

    /** 获取默认储存路径 */
    static get getDefaultPath (): string {
        let theDefaultPath = 'default';
        if (contextContainer.instance && contextContainer.instance.extensionUri) {
            theDefaultPath = cryHex(joinPathUri(contextContainer.instance.extensionUri, ...defaultPath).fsPath);
        }
        return theDefaultPath;
    }

    /** 获取背景图配置信息 */
    static getBackgroundConfiguration (name: string): any {
        return getWorkSpace(this.namespace).get<any>(name);
    }

    /**
     * 更新背景图配置信息
     * @param name 
     * @param value 
     */
    static setBackgroundConfiguration (name: string, value: any): Thenable<void> {
        return setWorkSpace(this.namespace, name, value);
    }

    /** 获取当前储存路径，如果有则返回哈希值 */
    static get getSettingStorePath (): string | undefined {
        const path = this.getBackgroundStorePath;
        if (path) {
            return cryHex(path);
        } else {
            return void 0;
        }
    }

    /** 获取所有图片哈希码数组的储存数据 */
    static get getBackgroundAllImageObject(): { [key: string]: string[] } {
        return this.getBackgroundConfiguration('allImageCodes');
    }

    /**
     * 设置当前路径下的哈希码数组缓存
     * @param value 
     */
    static setBackgroundAllImageObject (value: string[]): Thenable<void> {
        const path = this.getSettingStorePath??this.getDefaultPath,
        data = this.getBackgroundAllImageObject,
        // 整理数据，去除没有数据的索引
        result: { [key: string]: string[] } = {};
        if (value.length > 0) {
            result[path] = value;
        }
        for (let name in data) {
            if (data[name] && data[name].length > 0 && name !== path) {
                result[name] = data[name];
            }
        }
        return this.setBackgroundConfiguration('allImageCodes', result);
    }

    /** 获取所有选择的图片哈希值数据 */
    static get getBackgroundAllImageCodes (): string[] {
        const path = this.getSettingStorePath??this.getDefaultPath,
        data = this.getBackgroundAllImageObject;
        // 没有对应属性则新创建一个
        if (!data.hasOwnProperty(path)) {
            data[path] = [];
        }
        return data[path];
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
        }, err => {
            return Promise.reject(err);
        });
    }

    /**
     * 更新图片数组数据
     * @param value 
     */
    static refreshBackgroundImagePath (value: string[]): Thenable<void> {
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