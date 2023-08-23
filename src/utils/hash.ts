import { createHash } from "crypto";

/**
 * node默认的加密算法
 * @param s 需要生成哈希码的字符串
 */
export function cryHex (s: string): string {
    return createHash('md5').update(s).digest('hex');
}

/**
 * 生成哈希码
 * @param s 
 */
export function selfHex (s: string) {
    let data = new Uint8Array(encodeUTF8(s));
    // >>> 无符号右移
    let l = ((data.length + 8) >>> 6 << 4) + 16, u8: Uint8Array | undefined = new Uint8Array(l << 2);
    u8.set(new Uint8Array(data.buffer))
    let u32 = new Uint32Array(u8.buffer);
    u8 = undefined;
    let t: DataView = new DataView(u32.buffer)
    for (let i = 0; i < l; i++) {
        u32[i] = t.getUint32(i << 2);
        u32[data.length >> 2] = 0x80 << (24 - (data.length & 3) * 8);
        u32[l - 1] = data.length << 3;
    }
    let w: number[] = [];
    const m: Array<number | null> = [1732584193, -271733879, null, null, -1009589776];
    const k: number[] = [1518500249, 1859775393, -1894007588, -899497514];
    m[2] = ~m[0]!;
    m[3] = ~m[1]!;
    const rol = (n: number, c: number) => n << c | n >>> (32 - c);
    const f = [
        () => m[1]! & m[2]! | ~m[1]! & m[3]!,
        () => m[1]! ^ m[2]! ^ m[3]!,
        () => m[1]! & m[2]! | m[1]! & m[3]! | m[2]! & m[3]!,
        () => m[1]! ^ m[2]! ^ m[3]!
    ];
    for (let i = 0; i < u32.length; i += 16) {
        let o = m.slice(0);
        for (let j = 0; j < 80; j++) {
            w[j] = j < 16 ? 
                u32[i + j] : 
                rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
            let index = rol(m[0]!, 5) + f[j / 20 | 0]() + m[4]! + w[j] + k[j / 20 | 0] | 0;
            m[1] = rol(m[1]!, 30);
            m.pop();
            m.unshift(index);
        }
        for (let j = 0; j < 5; j++) {
            m[j] = m[j]! + o[j]! | 0;
        }
    }
    t = new DataView(new Uint32Array(m as number[]).buffer);
    for (let i = 0; i < 5; i++) {
        m[i] = t.getUint32(i << 2);
    }
    let hex = Array.prototype.map.call(new Uint8Array(new Uint32Array(m as number[]).buffer), function (e) {
        return (e < 16 ? "0" : "") + e.toString(16);
    }).join("");
    return hex;
}

/**
 * 编码为utf8
 * @param s 
 */
function encodeUTF8 (s: string): number[] {
    let c: number, r: number[] = [], x: number;
    for (let i = 0; i < s.length; i++) {
        if ((c = s.charCodeAt(i)) < 0x80) {
            r.push(c);
        } else if (c < 0x800) {
            // >> 二进制向右移位；& 二进制与运算
            r.push(0xC0 + (c >> 6 & 0x1F), 0x80 + (c & 0x3F));
        } else {
            // ^ 二进制异或运算
            if ((x = c ^ 0x800) >> 10 == 0) {
                // 四字节UTF-16转为unicode
                c = (x << 10) + (s.charCodeAt(++i) ^ 0xDC00) + 0x10000;
                r.push(0xF0 + (c >> 18 & 0x7), 0x80 + (c >> 12 & 0x3F));
            } else {
                r.push(0xE0 + (c >> 12 & 0xF));
            }
            r.push(0x80 + (c >> 6 & 0x3F), 0x80 + (c & 0x3F));
        }
    }
    return r;
}