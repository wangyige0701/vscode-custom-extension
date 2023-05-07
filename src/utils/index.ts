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
export function getDate(date: Date | undefined = undefined, format: string = "YYYY-MM-DD hh:mm:ss"): string | Error {
    let legal = '[^a-zA-Z0-9\\n\\f\\r\\t\\v]'; // 合法连接符
    let reg = new RegExp(`^YYYY(${legal}{1})MM(${legal}{1})DD(${legal}{1})hh(${legal}{1})mm(${legal}{1})ss$`);
    // 校验时间格式
    if (!format || !check(format, reg)) return new Error("时间格式错误");
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