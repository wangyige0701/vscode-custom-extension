/** @description 校验是否是设置的背景图 */


/**
 * 检查指定code是否是当前设置背景图的code
 * @param codeValue 
 * @returns 如果state为false时也传了code，则此code是最新需要被设置的图片哈希码
 */
export function checkCurentImageIsSame (codeValue: string): Promise<{ state:boolean, code?:string }> {
    return new Promise((resolve, reject) => {
        Promise.resolve(<Promise<void>>new Promise(($resolve, $reject) => {
            if (!codeValue) {
                return $reject({ jump: true, state: false });
            }
            $resolve();
        })).then(() => {
            return getExternalFileContent();
        }).then(content => {
            return findInfo(content[0]);
        }).then(data => {
            if (data) {
                const { ImageCode } = data;
                // 如果和上一次是一个哈希值，不再更新数据
                if (ImageCode === codeValue) {
                    return Promise.reject({ jump: true, state: true, code: ImageCode });
                }
            }
            resolve({ state: false, code: codeValue });
        }).catch(err => {
            if (err.jump) {
                return resolve({ state: err.state, code: err.code??void 0 });
            }
            reject($rej(err, checkCurentImageIsSame.name));
        });
    });
}