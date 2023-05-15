import { WorkspaceConfiguration } from "vscode";
import { getWorkSpace, setWorkSpace } from ".";
import { isNumber, isString } from "../utils";

const namespace = 'wangyige.background';

export const backgroundImageConfiguration = {
    /**
     * 获取背景图配置信息
     * @returns 
     */
    getBackgroundConfiguration (): WorkspaceConfiguration {
        return getWorkSpace(namespace);
    },

    /**
     * 更新背景图配置信息
     * @param name 
     * @param value 
     */
    setBackgroundConfiguration (name: string, value: any): void {
        setWorkSpace(namespace, name, value);
    },

    /**
     * 获取所有选择的图片哈希值数据
     * @returns {string[]}
     */
    getBackgroundAllImagePath (): string[] {
        return backgroundImageConfiguration.getBackgroundConfiguration().allImagePath;
    },

    /**
     * 更新图片哈希值数组数据
     * @param value 添加或删除的图片哈希码，如果删除某条数据可以直接传对应索引
     * @param state 添加：add, 删除：delete
     * @returns 
     */
    setBackgroundAllImagePath (value: string | number, state: 'add' | 'delete' = 'add'): void {
        const list: string[] = backgroundImageConfiguration.getBackgroundAllImagePath();
        if (state === 'add' && isString(value)) {
            // 添加一个图片数据
            list.push(value as string);
        } else if (state === 'delete') {
            if (isString(value)) 
                value = list.findIndex(item => item === value);
            if (!(isNumber(value) && value as number >= 0)) return;
            list.splice(value as number, 1);
        }
        backgroundImageConfiguration.setBackgroundConfiguration('allImagePath', list);
    },

    /**
     * 更新图片数组数据
     * @param value 
     */
    refreshBackgroundImagePath (value: string[]): void {
        backgroundImageConfiguration.setBackgroundConfiguration('allImagePath', value);
    },

    /**
     * 当前是否选择了图片，即侧栏中是否有图片数据
     * @returns 
     */
    getBackgroundHasImage (): boolean {
        return backgroundImageConfiguration.getBackgroundConfiguration().hasImage;
    },

    /**
     * 是否选择图片状态修改
     * @param value 
     * @returns 
     */
    setBackgroundHasImage (value: boolean): void {
        return backgroundImageConfiguration.setBackgroundConfiguration('hasImage', value);
    },

    /**
     * 是否设置了背景图
     * @returns {boolean}
     */
    getBackgroundIsSetBackground (): boolean {
        return backgroundImageConfiguration.getBackgroundConfiguration().isSetBackground;
    },

    /**
     * 是否设置了背景图状态修改
     * @param value 
     * @returns 
     */
    setBackgroundIsSetBackground (value: boolean): void {
        return backgroundImageConfiguration.setBackgroundConfiguration('isSetBackground', value);
    },

    /**
     * 当前选中的图片哈希值
     * @returns {string}
     */
    getBackgroundNowImagePath (): string {
        return backgroundImageConfiguration.getBackgroundConfiguration().nowImagePath;
    },

    /**
     * 当前选中图片哈希值数据更新
     * @param value 
     * @returns 
     */
    setBackgroundNowImagePath (value: string): void {
        return backgroundImageConfiguration.setBackgroundConfiguration('nowImagePath', value);
    },

    /**
     * 当前背景透明度
     * @returns {number}
     */
    getBackgroundOpacity (): number {
        return backgroundImageConfiguration.getBackgroundConfiguration().opacity;
    },

    /**
     * 背景透明度数据更新
     * @param value 
     * @returns 
     */
    setBackgroundOpacity (value: number): void {
        return backgroundImageConfiguration.setBackgroundConfiguration('opacity', value);
    },

    /**
     * 当前选择文件默认路径
     * @returns 
     */
    getBackgroundSelectDefaultPath (): string {
        return backgroundImageConfiguration.getBackgroundConfiguration().defaultPath;
    },

    /**
     * 设置默认路径
     * @param value 
     * @returns 
     */
    setBackgroundSelectDefaultPath (value: string): void {
        return backgroundImageConfiguration.setBackgroundConfiguration('defaultPath', value);
    },

    /**
     * 获取背景图加载状态
     * @returns 
     */
    getBackgroundLoad (): boolean {
        return backgroundImageConfiguration.getBackgroundConfiguration().load;
    },

    /**
     * 设置背景图加载状态
     * @param value 
     * @returns 
     */
    setBackgroundLoad (value: boolean): void {
        return backgroundImageConfiguration.setBackgroundConfiguration('load', value);
    },

    /**
     * 获取当前背景图储存路径
     * @returns 
     */
    getBackgroundStorePath (): string {
        return backgroundImageConfiguration.getBackgroundConfiguration().storePath;
    },

    /**
     * 设置背景图储存路径
     * @param value 
     * @returns 
     */
    setBackgroundStorePath (value: string): void {
        return backgroundImageConfiguration.setBackgroundConfiguration('storePath', value);
    }
}