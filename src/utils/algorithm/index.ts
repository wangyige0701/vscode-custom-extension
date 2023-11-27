
/** 二分降序查找 */
export function bisectionDesc<T> (array: T[], target: T): number {
    let length = array.length;
    if (length === 0) {
        return length;
    }
    if (target > array[0]) {
        return 0;
    } else if (target < array[length - 1]) {
        return length;
    } else {
        return bisection(array, target, 0, array.length, 'desc');
    }
}

/** 二分升序查找 */
export function bisectionAsce<T> (array: T[], target: T): number {
    let length = array.length;
    if (length === 0) {
        return length;
    }
    if (target < array[0]) {
        return 0;
    } else if (target > array[length - 1]) {
        return length;
    } else {
        return bisection(array, target, 0, array.length, 'asce');
    }
}

/**
 * 二分查找处理
 * @param array 
 * @param target 
 * @param start 
 * @param length 
 * @param type 
 */
function bisection<T> (array: T[], target: T, start: number, length: number, type: 'desc' | 'asce'): number {
    if (length === 2) {
        return start + 1;
    }
    let odd = length % 2 > 0; // 是否是奇数
    length = parseInt((length / 2)+'');
    let middle = start + length; // 二分中位
    let leftLength = length + 1, // 左侧长度是原长除以二加一
        rightLength = odd ? length + 1 : length;
    let judge = array[middle];
    if (judge > target) {
         // 中位数比目标值大，升序取左边继续二分，start不变；降序取右边
        return type === 'asce' ? 
            bisection(array, target, start, leftLength, type) : 
            bisection(array, target, middle, rightLength, type);
    } else {
        return type === 'asce' ? 
            bisection(array, target, middle, rightLength, type) : 
            bisection(array, target, start, leftLength, type);
    }
}