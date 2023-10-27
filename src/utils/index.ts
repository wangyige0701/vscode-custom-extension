import { cryHex } from "./hash";

/**
 * 根据日期数据生成格式化日期字符串
 * @param date 日期，可以传入Date格式或者时间戳格式
 * @param format 时间内容展示格式；年-YYYY；月-MM；日-DD；时-hh；分-mm；秒-ss；
 * @returns 格式化日期字符串
 */
export function getDate(date: Date | number | undefined = void 0, format: string = "YYYY-MM-DD hh:mm:ss"): string {
    // 校验时间格式
    if (!format) {
        format = "YYYY-MM-DD hh:mm:ss";
    }
    // 判断是否传入正确日期格式
    if (isNumber(date)) {
        date = new Date(date);
    } else if (!date || !(date instanceof Date)) {
        date = new Date();
    }
    const y = date.getFullYear().toString(),
    m = addZero(date.getMonth() + 1),
    d = addZero(date.getDate()),
    h = addZero(date.getHours()),
    mm = addZero(date.getMinutes()),
    s = addZero(date.getSeconds());
    return format.replace("YYYY", y).replace("MM", m).replace("DD", d).replace("hh", h).replace("mm", mm).replace("ss", s);
}

/**
 * 对数字进行补零
 * @param value 需要补位的数字
 * @param length 期望的长度
 * @returns 补齐的数字字符串
 */
export function addZero (value: number | string, length: number = 2): string {
    return value.toString().padStart(length, '0');
}

/** 迭代器循环数字范围 */
export function *range (end: number, start: number = 0, step: number = 1) {
    const compare = start <= end;
    step = Math.max(Math.abs(step), 1);
    for (let i = start; compare ? i < end : i > end; compare ? i += step : i -= step) {
        yield i;
    }
}

/** 生成一个唯一标识，目前在注册webview页面时使用 */
export function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (const i of range(32)) {
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
    for (const i of range(length)) {
        str += Math.floor(Math.random() * 36).toString(36);
    }
    return str;
}

/** 根据时间戳生成一个16进制哈希码 */
export function getHashCode (): string {
    return cryHex(randomHexString());
}

/** 生成随机id，使用时间戳乘以随机数再转换为16进制，并将小数点替换为随机字符 */
export const randomHexString: () => string = (function () {
    const str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length = str.length;
    function create (): string {
        return (Math.random() * Date.now()).toString(16).replace(/\./g, str.charAt(Math.floor(Math.random() * length)));
    }
    return create;
})();

/**
 * 是否是字符串类型
 * @param value 
 */
export function isString (value: any): value is string {
    return typeof value === 'string';
}

/**
 * 是否是数字类型
 * @param value 
 */
export function isNumber (value: any): value is number {
    return typeof value === 'number' && !isNaN(value);
}

/**
 * 是否是数组类型
 * @param value 
 */
export function isArray (value: any): value is any[] {
    return Array.isArray(value);
}

/**
 * 是否是null类型
 * @param value 
 */
export function isNull (value: any): value is null {
    return value === null;
}

/**
 * 是否是对象类型
 * @param value 
 */
export function isObject (value: any): value is {[key:string|number]:any} {
    return typeof value === 'object' && !isArray(value) && !isNull(value);
}

/**
 * 是否是undefined类型
 * @param value 
 */
export function isUndefined (value: any): value is undefined {
    return typeof value === 'undefined';
}

/**
 * 是否是函数类型
 * @param value 
 */
export function isFunction (value: any): value is Function {
    return typeof value === 'function';
}

/**
 * 是否是布朗类型
 * @param value 
 */
export function isBoolean (value: any): value is boolean {
    return typeof value === 'boolean';
}

/**
 * 是否是symbol类型
 * @param value
 */
export function isSymbol (value: any): value is symbol {
    return typeof value === 'symbol';
}

/**
 * 是否是Promise
 * @param value
 */
export function isPromise (value: any): boolean {
    return value && typeof value.then === 'function';
}

/**
 * 输出在一个最小最大范围内的值
 * @param min 最小值
 * @param max 最大值
 * @param value 判断的数据
 */
export function minmax (min: number, max: number, value: number): number {
    return value <= min ? min : value >= max ? max : value;
}

/**
 * 延迟指定时间
 * @param time 
 */
export function delay (time: number = 0): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, time);
    });
}

/** 返回一个空的Promise函数 */
export function voidFunc (): Promise<void> {
    return new Promise(resolve => {
        resolve();
    });
}

/**
 * 生成一个指定范围的随机整数 [start, end)
 * @param start 起始位置，闭区间
 * @param end 结束位置，开区间
 */
export function getRandom (start: number, end: number): number {
    return ~~(Math.random() * (end - start) + start);
}

/**
 * 将字符串第一个字符大写
 */
export function firstUpperCase (data: string) {
    if (isString(data)) {
        return data.charAt(0).toUpperCase() + data.slice(1);
    }
    return data;
}

/**
 * 创建一个队列执行对象
 */
export function queueCreate (immediately: boolean = true) {
    let executeing: boolean = false;
    const queue: Array<Function|Promise<any>> = [];
    /** 插入队列 */
    function set (func: Function|Promise<any>) {
        if (!func || (!isFunction(func) && !isPromise(func))) {
            return;
        }
        queue.push(func);
        if (immediately && !executeing) {
            execute();
        }
    }
    /** 执行队列 */
    function execute () {
        if (queue.length <= 0) {
            executeing = false;
            return;
        }
        executeing = true;
        const executeTarget = queue.shift();
        Promise.resolve(
            isFunction(executeTarget) ? executeTarget() : executeTarget
        ).then(() => {
            if (queue.length === 0) {
                executeing = false;
            } else {
                immediately && execute();
            }
        }).catch(err => {
            executeing = false;
            throw new Error(err);
        });
    }
    function clear () {
        executeing = false;
        queue.splice(0);
    }
    return {
        set,
        execute,
        clear
    };
}

/**
 * 创建带有额外参数的promise
 */
export function createExParamPromise<T, P extends Array<any>>(prom: Promise<T>, ...params: P): Promise<MergeTypes<T, P>> {
    return new Promise((resolve, reject) => {
        Promise.resolve(prom).then(data => {
            resolve([data, ...params]);
        }).catch(err => {
            reject(err);
        });
    });
}

/** 按序执行所有函数 */
export async function executeAllFunctions (...funcs: Array<Function>) {
    for (const item of funcs) {
        if (item && isFunction(item)) {
            item();
        }
    }
}

/** 字符串第一个字符大写 */
export function firstStrUpperCase (str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/** 字符串第一个字符小写 */
export function firstStrLowerCase (str: string) {
    return str.charAt(0).toLowerCase() + str.slice(1);
}

/**
 * 阿拉伯数字转汉字
 */
export function arabicNumeralsToChinese (num: number) {
    const chineseNumbers = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    const unitToThousand = ['', '十', '百', '千'];
    const unitToMore = ['', '万', '亿', '兆', '京', '垓', '秭', '穰', '沟', '涧', '正', '载', '极'];
    if (num === 0) {
        return chineseNumbers[0];
    }
    const origin = String(num);
    function _unit (str: string) {
        if (str === "0000") {
            return '';
        }
        let result = '';
        for (const i of range(str.length, 0, 1)) {
            const item = str.charAt(str.length - i - 1);
            let l = chineseNumbers[+item];
            if (l === '零' && result.startsWith('零')) {
                continue;
            }
            if (l !== '零') {
                l += unitToThousand[i];
            }
            result = l + result;
        }
        if (result.length > 0 && result.endsWith('零')) {
            result = result.slice(0, result.length - 1);
        }
        if (result.startsWith('一十')) {
            result = result.slice(1);
        }
        return result;
    }
    let result = '';
    for (const i of range(Math.ceil(origin.length / 4))) {
        const start = origin.length - (i * 4);
        const str = _unit(origin.slice( Math.max(start - 4, 0), start));
        if (result.startsWith('零') && str === '零') {
            continue; 
        }
        if (result === '零' && str !== '零') {
            result = str;
            continue;
        }
        result = str + unitToMore[i] + result;
    }
    if (result.startsWith('零')) {
        result = result.slice(1);
    }
    return result;
}