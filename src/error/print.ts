/**
 * 返回带有颜色的字符串
 * @param color string
 * @param content 需要生成颜色的字符串
 */
export function color (color: 'red'|'green'|'blue'|'yellow', content: string): string {
    switch (color) {
        case 'red':
            return `\x1B[31m${content}\x1B[0m`;
        case 'green':
            return `\x1B[32m${content}\x1B[0m`;
        case 'yellow':
            return `\x1B[33m${content}\x1B[0m`;
        case 'blue':
            return `\x1B[34m${content}\x1B[0m`;
        default:
            return content;
    }
}