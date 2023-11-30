/** @description 匹配css文件中标签包裹的配置内容 */



/**
 * 获取背景设置css文件的相关信息
 * @param content 
 */
export function findInfo (content: string): Promise<info | false> {
    return new Promise((resolve, reject) => {
        Promise.resolve().then(() => {
            const reg = content.match(findExternalCssPositionRegexp);
            // 有匹配项返回信息
            if (reg) {
                return resolve({
                    VSCodeVersion: reg[1],
                    ExtensionVersion: reg[2],
                    Date: reg[3],
                    ImageCode: reg[4]
                });
            }
            resolve(false);
        }).catch(err => {
            reject($rej(err, findInfo.name));
        });
    });
}