import { toHex } from "./hash";

/**
 * 对字符串进行正则校验
 * @param str {String} 验证字符串
 * @param reg {RegExp} 正则校验，默认非换行符的任意多字符
 * @returns 校验结果
 */
export function check (str: string, reg: RegExp = /^.*$/): boolean {
    return reg.test(str);
}

/**
 * 根据日期数据生成格式化日期字符串
 * @param date {Date} 日期
 * @param format {String} 时间内容展示格式
 * @returns 格式化日期字符串
 */
export function getDate(date: Date | undefined = undefined, format: string = "YYYY-MM-DD hh:mm:ss"): string {
    let legal = '[^a-zA-Z0-9\\n\\f\\r\\t\\v]'; // 合法连接符
    let reg = new RegExp(`^YYYY(${legal}{1})MM(${legal}{1})DD(${legal}{1})hh(${legal}{1})mm(${legal}{1})ss$`);
    // 校验时间格式
    if (!format || !check(format, reg)) throw new Error("时间格式错误");
    // 判断是否传入日期
    if (date === undefined) date = new Date();
    const formatCode = format.match(reg)?.slice(1, 6);
    // 获取时间连接符
    const [f1, f2, f3, f4, f5] = formatCode!;
    let y = date.getFullYear();
    let m = addZero(date.getMonth() + 1);
    let d = addZero(date.getDate());
    let h = addZero(date.getHours());
    let mm = addZero(date.getMinutes());
    let s = addZero(date.getSeconds());
    return `${y}${f1}${m}${f2}${d}${f3}${h}${f4}${mm}${f5}${s}`;
}

/**
 * 对数字进行补位
 * @param value 补位的数字
 * @param length 期望的长度
 * @returns 补齐的数字字符串
 */
export function addZero (value: number | string, length: number = 2): string {
    value = value.toString();
    let left = value.split('.')[0];
    if (left.length < length) {
        for (let i of range(length - left.length)) {
            value = '0' + value;
        }
    }
    return value;
}

/**
 * 迭代器循环数字范围
 */
export function *range (end: number, start: number = 0, step: number = 1) {
    for (let i = start; i < end; i += step) {
        yield i;
    }
}

/**
 * 生成一个唯一标识
 * @returns 
 */
export function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

/**
 * 生成一个指定长度的随机序列，默认24位
 * @param {number|string} length 生成随机字符串的长度
 * @returns 返回一个随机序列
 */
export function getRandomCode (length: number | string = 24): string {
    let str: string = '';
    length = Number(length) || 24 as number;
    for (let i: number = 0; i < length; i++) {
        str += Math.floor(Math.random() * 36).toString(36);
    }
    return str;
}

/**
 * 根据时间戳生成一个16进制哈希码
 * @returns 
 */
export function getHashCode (): string {
    return toHex(String(new Date().getTime()));
}

/**
 * 是否是字符串类型
 * @param value 
 * @returns {boolean}
 */
export function isString (value: any): value is string {
    return typeof value === 'string';
}

/**
 * 是否是数字类型
 * @param value 
 * @returns {boolean}
 */
export function isNumber (value: any): value is number {
    return typeof value === 'number';
}

/**
 * 是否是数组类型
 * @param value 
 * @returns {boolean}
 */
export function isArray (value: any): value is any[] {
    return Array.isArray(value);
}

/**
 * 是否是null类型
 * @param value 
 * @returns {boolean}
 */
export function isNull (value: any): value is null {
    return value === null;
}

/**
 * 是否是对象类型
 * @param value 
 * @returns {boolean}
 */
export function isObject (value: any): value is {[key:string|number]:any} {
    return typeof value === 'object' && !isArray(value) && !isNull(value);
}

/**
 * 是否是undefined类型
 * @param value 
 * @returns {boolean}
 */
export function isUndefined (value: any): value is undefined {
    return typeof value === 'undefined';
}

/**
 * 是否是函数类型
 * @param value 
 * @returns {boolean}
 */
export function isFunction (value: any): value is Function {
    return typeof value === 'function';
}

/**
 * 是否是布朗类型
 * @param value 
 * @returns {boolean}
 */
export function isBoolean (value: any): value is boolean {
    return typeof value === 'boolean';
}

/**
 * 输出在一个最小最大范围内的值
 * @param min 最小值
 * @param max 最大值
 * @param value 判断的数据
 * @returns 
 */
export function minmax (min: number, max: number, value: number): number {
    return value <= min ? min : value >= max ? max : value;
}

type switchData = string | number | boolean;

interface newSwitchCase {
    case: (key: switchData, func: Function) => void | newSwitchCase;
}

/**
 * 使用if-else的switch方法，测试
 * @param name 
 * @returns 
 */
export function newSwitch (name: switchData): void | newSwitchCase {
    return {
        case: function (key: switchData, func: Function) {
            if (key === name) {
                func?.();
            } else {
                return this;
            }
        }
    }
}

/**
 * 延迟指定时间
 * @param time 
 * @returns 
 */
export function delay (time: number = 0): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, time);
    });
}

/**
 * 返回一个空的Promise函数
 * @returns 
 */
export function voidFunc (): Promise<void> {
    return new Promise(resolve => {
        resolve();
    });
}

/**
 * 生成一个指定范围的随机整数 [start, end)
 * @param start 起始位置，闭区间
 * @param end 结束位置，开区间
 * @returns 
 */
export function getRandom (start: number, end: number): number {
    return ~~(Math.random() * (end - start) + start);
}