import { clearBackgroundConfigExecute } from "./app/background/index";
import { errlog } from "./error";
import { clearConfiguration } from "./version/uninstall";

/** 清除配置 */
async function uninstall () {
    await Promise.resolve(
        clearBackgroundConfigExecute()
    ).then(() => {
        return clearConfiguration();
    }).then(() => {
        return Promise.resolve();
    }).catch(err => {
        errlog(err);
    });
}

uninstall();