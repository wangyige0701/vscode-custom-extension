import { createHash } from "crypto";

/**
 * node默认的加密算法
 * @param s 需要生成哈希码的字符串
 */
export function cryHex (s: string): string {
    return createHash('md5').update(s).digest('hex');
}
