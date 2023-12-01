

/**
 * 新旧数组进行比较，因为是比较哈希码，不存在数组元素重复的问题
 * @param long 长一点的数组，用于校验
 * @param short 短一点的数组
 */
export async function compareCodeList (long: string[], short: string[], type: 'add' | 'delete' = 'add'): Promise<void> {
    for (const item of long) {
        const index = short.findIndex(i => i === item);
        // 直接使用字符串进行操作，因为删除一个数据后再传索引对应的数据会不正确
        if (index < 0) {
            await BackgroundConfiguration.setBackgroundAllImageCodes(item, type).catch(err => {
                return Promise.reject($rej(err, compareCodeList.name));
            });
        }
    }
    return Promise.resolve();
}