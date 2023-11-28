import { range } from "../main";

/**
 * 阿拉伯数字转汉字
 */
export function arabicNumeralsToChinese (num: number) {
    const chineseNumbers = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    if (num === 0) {
        return chineseNumbers[0];
    }
    const unitToThousand = ['', '十', '百', '千'];
    const unitToMore = ['', '万', '亿', '兆', '京', '垓', '秭', '穰', '沟', '涧', '正', '载', '极'];
    let sign = '';
    if (num < 0) {
        sign = '负';
        num = Math.abs(num);
    }
    const origin = num.toString();
    function _unit (str: string) {
        if (str === "0000") {
            return '';
        }
        let result = '';
        for (const i of range(str.length, 0, 1)) {
            const item = str.charAt(str.length - i - 1);
            let n = chineseNumbers[+item];
            if (n === '零' && result.startsWith('零')) {
                continue;
            }
            if (n !== '零') {
                n += unitToThousand[i];
            }
            result = n + result;
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
    return sign + result;
}