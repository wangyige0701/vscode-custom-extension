import { getWorkSpace, setWorkSpace } from ".";
import { isString } from "../utils";
import { cryHex } from '../utils/hash';

/**
 * 命名空间
 */
const namespace = 'wangyige.background';

/**
 * 背景图配置项对象
 */
export const backgroundImageConfiguration = {
    /**
     * 获取背景图配置信息
     * @returns 
     */
    getBackgroundConfiguration (name: string): any {
        return getWorkSpace(namespace).get<any>(name);
    },

    /**
     * 更新背景图配置信息
     * @param name 
     * @param value 
     */
    setBackgroundConfiguration (name: string, value: any): Thenable<void> {
        return setWorkSpace(namespace, name, value);
    },

    /**
     * 获取当前储存路径，如果有则返回哈希值
     * @returns 
     */
    getSettingStorePath (): string | undefined {
        const path = this.getBackgroundStorePath();
        if (path) {
            return cryHex(path);
        } else {
            return undefined;
        }
    },

    /**
     * 获取所有图片哈希码数组的储存数据
    */
    getBackgroundAllImageObject(): { [key: string]: string[] } {
        return this.getBackgroundConfiguration('allImagePath');
    },

    /**
     * 设置当前路径下的哈希码数组缓存
     * @param value 
     * @returns 
     */
    setBackgroundAllImageObject (value: string[]): Thenable<void> {
        const path = this.getSettingStorePath()??'default';
        const data = this.getBackgroundAllImageObject();
        data[path] = value;
        return this.setBackgroundConfiguration('allImagePath', data);
    },

    /**
     * 获取所有选择的图片哈希值数据
     * @returns {string[]}
     */
    getBackgroundAllImagePath (): string[] {
        const path = this.getSettingStorePath()??'default';
        const data = this.getBackgroundAllImageObject();
        // 没有对应属性则新创建一个
        if (!data.hasOwnProperty(path)) data[path] = [];
        return data[path];
    },

    /**
     * 更新图片哈希值数组数据
     * @param value 添加或删除的图片哈希码，如果删除某条数据可以直接传对应索引
     * @param state 添加：add, 删除：delete
     * @returns 
     */
    async setBackgroundAllImagePath (value: string | number, state: 'add' | 'delete' = 'add'): Promise<void> {
        const list: string[] = this.getBackgroundAllImagePath();
        if (state === 'add' && isString(value)) {
            // 添加一个图片数据
            list.unshift(value);
        } else if (state === 'delete') {
            if (isString(value)) 
                value = list.findIndex(item => item === value);
            if (value < 0) 
                return Promise.resolve();
            list.splice(value, 1);
        }
        await this.setBackgroundAllImageObject(list).then(() => {
            return Promise.resolve();
        }, err => {
            return Promise.reject(err);
        });
    },

    /**
     * 更新图片数组数据
     * @param value 
     */
    refreshBackgroundImagePath (value: string[]): Thenable<void> {
        // 只更新对应属性的数据
        return this.setBackgroundAllImageObject(value);
    },

    /**
     * 是否设置了背景图
     * @returns {boolean}
     */
    getBackgroundIsSetBackground (): boolean {
        return this.getBackgroundConfiguration('isSetBackground');
    },

    /**
     * 是否设置了背景图状态修改
     * @param value 
     * @returns 
     */
    setBackgroundIsSetBackground (value: boolean): Thenable<void> {
        return this.setBackgroundConfiguration('isSetBackground', value);
    },

    /**
     * 当前选中的图片哈希值
     * @returns {string}
     */
    getBackgroundNowImagePath (): string {
        return this.getBackgroundConfiguration('nowImagePath');
    },

    /**
     * 当前选中图片哈希值数据更新
     * @param value 
     * @returns 
     */
    setBackgroundNowImagePath (value: string): Thenable<void> {
        return this.setBackgroundConfiguration('nowImagePath', value);
    },

    /**
     * 当前背景透明度
     * @returns {number}
     */
    getBackgroundOpacity (): number {
        return this.getBackgroundConfiguration('opacity');
    },

    /**
     * 背景透明度数据更新
     * @param value 
     * @returns 
     */
    setBackgroundOpacity (value: number): Thenable<void> {
        return this.setBackgroundConfiguration('opacity', value);
    },

    /**
     * 当前选择文件默认路径
     * @returns 
     */
    getBackgroundSelectDefaultPath (): string {
        return this.getBackgroundConfiguration('defaultPath');
    },

    /**
     * 设置默认路径
     * @param value 
     * @returns 
     */
    setBackgroundSelectDefaultPath (value: string): Thenable<void> {
        return this.setBackgroundConfiguration('defaultPath', value);
    },

    /**
     * 获取背景图加载状态
     * @returns 
     */
    getBackgroundLoad (): boolean {
        return this.getBackgroundConfiguration('load');
    },

    /**
     * 设置背景图加载状态
     * @param value 
     * @returns 
     */
    setBackgroundLoad (value: boolean): Thenable<void> {
        return this.setBackgroundConfiguration('load', value);
    },

    /**
     * 获取当前背景图储存路径
     * @returns 
     */
    getBackgroundStorePath (): string {
        return this.getBackgroundConfiguration('storePath');
    },

    /**
     * 设置背景图储存路径
     * @param value 
     * @returns 
     */
    setBackgroundStorePath (value: string): Thenable<void> {
        return this.setBackgroundConfiguration('storePath', value);
    },

    /**
     * 获取是否开启了随机切换背景图状态
     * @returns 
     */
    getBackgroundIsRandom (): boolean {
        return this.getBackgroundConfiguration('isRandom');
    },

    /**
     * 设置是否开启了随机切换背景图状态
     * @param value 
     * @returns 
     */
    setBackgroundIsRandom (value: boolean): Thenable<void> {
        return this.setBackgroundConfiguration('isRandom', value);
    },

    /**
     * 获取随机切换的背景图哈希码数组
     * @returns 
     */
    getBackgroundRandomList (): string[] {
        return this.getBackgroundConfiguration('randomList');
    },

    /**
     * 设置随机切换的背景图哈希码数组
     * @param value 
     * @returns 
     */
    setBackgroundRandomList (value: string[]): Thenable<void> {
        return this.setBackgroundConfiguration('randomList', value);
    },

    /**
     * 获取下一次启动时随机切换的图片哈希码
     * @returns 
     */
    getBackgroundRandomCode (): string {
        return this.getBackgroundConfiguration('randomCode');
    },

    /**
     * 设置下一次启动时随机切换的图片哈希码
     * @param value 
     * @returns 
     */
    setBackgroundRandomCode (value: string): Thenable<void> {
        return this.setBackgroundConfiguration('randomCode', value);
    }
}