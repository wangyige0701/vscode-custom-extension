import { ProcessExit, packageFileExits } from '.';

/** 生产环境发布前进行webview打包确认 */
if (!process.env.NODE_ENV) {
    if (!packageFileExits()) {
        ProcessExit('请执行npm run pre或者通过调试启动Run Pre', 1);
    }
}

function now_ver () {
    const json = require('../../package.json');
    return json.version as string;
}

function least_ver () {}