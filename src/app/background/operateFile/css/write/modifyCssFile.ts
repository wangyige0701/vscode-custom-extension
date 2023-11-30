/** @description 修改css文件 */



/**
 * 修改外部css文件的背景图属性
 * @param code 图片的哈希码
 * @param random 是否为随机设置背景图状态
 * @param tip 是否需要显示提示文本
 */
export function modifyCssFileForBackground (code: string, random: boolean = false, tip: boolean = true): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!code) {
            return reject(new WError('Undefined Hash Code', {
                position: 'Parameter',
                FunctionName: modifyCssFileForBackground.name,
                ParameterName: 'code',
                description: 'The hash code to get image data is undefined'
            }));
        }
        let statusBarTarget: Disposable;
        getExternalCssContent(code).then(res => {
            if (res === false) {
                // 不需要更新，直接跳出
                return Promise.reject({ jump: true });
            }
            // 状态栏提示文字
            if (tip) {
                statusBarTarget = setStatusBarResolve({
                    icon: 'loading~spin',
                    message: `${random?'随机':''}背景图设置中`
                });
            }
            return createExParamPromise(writeExternalCssFile(res[0]), res[1]);
        }).then(([_, infoContent]) => {
            return settingConfiguration(infoContent, random);
        }).then(() => {
            return setSourceCssImportInfo();
        }).then(() => {
            statusBarTarget?.dispose();
            if (tip) {
                setBackgroundImageSuccess(`${random?'随机':''}背景图设置成功`);
            }
            resolve();
        }).catch(err => {
            // 传递了jump属性就resolve
            if (err.jump) {
                return resolve();
            }
            reject($rej(err, modifyCssFileForBackground.name));
        }).finally(() => {
            statusBarTarget?.dispose();
        });
    });
}