import { WorkspaceConfiguration } from "vscode";
import { getWorkSpace, setWorkSpace } from ".";

const namespace = 'wangyige.background';

/**
 * 获取背景图配置信息
 * @returns 
 */
export function getBackgroundConfiguration (): WorkspaceConfiguration {
    return getWorkSpace(namespace);
}

/**
 * 更新背景图配置信息
 * @param name 
 * @param value 
 */
export function setBackgroundConfiguration (name: string, value: any): void {
    setWorkSpace(namespace, name, value);
}

/**
 * 获取所有选择的图片数据
 * @returns {string[]}
 */
export function getBackgroundAllImagePath (): string[] {
    return getBackgroundConfiguration().allImagePath;
}

/**
 * 更新图片数组数据
 * @param value 添加或删除的路径字符串，如果删除某条数据可以直接传对应索引
 * @param state 添加：add, 删除：delete
 * @returns 
 */
export function setBackgroundAllImagePath (value: string | number, state: string = 'add'): void {
    const list: string[] = getBackgroundAllImagePath();
    if (state === 'add' && typeof value === 'string') {
        // 添加一个图片数据
        list.push(value);
    } else if (state === 'delete') {
        if (typeof value === 'string') value = list.findIndex(item => item === value);
        if (!(typeof value === 'number' && value >= 0)) return;
        list.splice(value, 1);
    }
    setBackgroundConfiguration('allImagePath', list);
}

/**
 * 当前是否选择了图片，即侧栏中是否有图片数据
 * @returns 
 */
export function getBackgroundHasImage (): boolean {
    return getBackgroundConfiguration().hasImage;
}

/**
 * 是否选择图片状态修改
 * @param value 
 * @returns 
 */
export function setBackgroundHasImage (value: boolean): void {
    return setBackgroundConfiguration('hasImage', value);
}

/**
 * 是否设置了背景图
 * @returns {boolean}
 */
export function getBackgroundIsSetBackground (): boolean {
    return getBackgroundConfiguration().isSetBackground;
}

/**
 * 是否设置了背景图状态修改
 * @param value 
 * @returns 
 */
export function setBackgroundIsSetBackground (value: boolean): void {
    return setBackgroundConfiguration('isSetBackground', value);
}

/**
 * 当前选中的图片路径
 * @returns {string}
 */
export function getBackgroundNowImagePath (): string {
    return getBackgroundConfiguration().nowImagePath;
}

/**
 * 当前选中图片路径数据更新
 * @param value 
 * @returns 
 */
export function setBackgroundNowImagePath (value: string): void {
    return setBackgroundConfiguration('nowImagePath', value);
}

/**
 * 当前背景透明度
 * @returns {number}
 */
export function getBackgroundOpacity (): number {
    return getBackgroundConfiguration().opacity;
}

/**
 * 背景透明度数据更新
 * @param value 
 * @returns 
 */
export function setBackgroundOpacity (value: number): void {
    return setBackgroundConfiguration('opacity', value);
}