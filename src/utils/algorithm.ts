
/**
 * 二分降序查找
 */
export function bisectionDesc () {}

/**
 * 二分升序查找
 */
export function bisectionAsce<T> (array: T[], target: T): number {
    let length = array.length;
    if (length === 0) return length;
    if (target < array[0]) {
        return 0;
    } else if (target > array[length - 1]) {
        return length;
    } else {
        return bisection(array, target, 0, array.length);
    }
}

function bisection<T> (array: T[], target: T, start: number, length: number): number {
    if (length === 2) return start + 1;
    let odd = length % 2 > 0; // 是否是奇数
    length = parseInt((length / 2)+'');
    let middle = start + length; // 二分中位
    let leftLength = length + 1, rightLength = odd ? length + 1 : length;
    let judge = array[middle];
    if (judge > target) {
         // 中位数比目标值大，取左边继续二分，start不变
        return bisection(array, target, start, leftLength);
    } else {
        return bisection(array, target, middle, rightLength);
    }
}