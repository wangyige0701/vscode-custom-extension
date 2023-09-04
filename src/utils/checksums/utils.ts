import { createHash } from "crypto";

/**
 * 计算文件校验和
 * @param content 需要计算的文件
 */
export function computeFileChecksums (content: string) {
    return createHash('md5').update(content).digest('base64').replace(/=+$/, '');
}