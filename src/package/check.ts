import { ProcessExit, packageFileExits, now_ver, getContent, consoleByColor } from '.';

/** 生产环境发布前进行webview打包确认 */
if (!process.env.NODE_ENV) {
    let check_res = packageFileExits();
    if (check_res === false) {
        ProcessExit(consoleByColor('yellow', '请执行npm run pre或者通过调试启动Run Pre'), 1);
    } else {
        let exu: Promise<string>[] = [], n_v = now_ver();
        check_res.forEach(item => {
            exu.push(check_ver(item, n_v));
        });
        Promise.all(exu).then(() => {
            console.log(consoleByColor('green', `\n打包状态及版本校验完成  （当前版本：v${n_v}）\n`));
        }).catch(err => {
            ProcessExit(consoleByColor('red', err) + consoleByColor('yellow', '\n请执行npm run pre或者通过调试启动Run Pre'), 1);
        });
    }
}

/**
 * 版本校验
 */
function check_ver (file_path: string, n_v: string): Promise<string> {
    return new Promise((resolve, reject) => {
        getContent(file_path).then(res => {
            let l_v = latest_ver(res);
            if (!l_v || l_v !== n_v) {
                reject(file_path + ' ---> 版本错误 >>> ' + `预发布版本：v${n_v}；打包文件版本：${l_v?'v'+l_v:'不存在'};`);
            } else {
                resolve(file_path);
            }
        }).catch(err => {
            reject(err);
        });
    });
}

/**
 * 获取最新版本
 */
function latest_ver (content: string): string | null {
    return content.match(/^.*?\/\*[\s]*version[\s]*:[\s]*(.*?)[\s]*\*\//)?.[1]??null;
}