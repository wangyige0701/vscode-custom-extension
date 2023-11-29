import { Uri } from "vscode";
import { joinPathUri } from "../../../common/file";
import { BackgroundConfiguration, defaultPath } from "../../../workspace/background";
import { WError, $rej } from "../../../error";
import { ExtensionUri } from "../../../common/system";
import { imageStoreUriExits } from "./private/modify";

/** 获取储存背景图资源的uri，指定路径不存在则会进行创建 */
export function imageStoreUri (): Promise<Uri> {
    return new Promise((resolve, reject) => {
        Promise.resolve().then(() => {
            const path: string = BackgroundConfiguration.getBackgroundStorePath;
            if (path) {
                // 缓存内有路径数据
                return Uri.file(path);
            } else {
                // 没有缓存数据则获取插件路径
                const uri = ExtensionUri.get;
                if (uri) {
                    return joinPathUri(uri, ...defaultPath);
                }
                return void 0;
            }
        }).then(uri => {
            if (!uri) {
                return Promise.reject(new WError('Undefined Uri', {
                    position: 'Function',
                    FunctionName: imageStoreUri.name,
                    ParameterName: 'uri',
                    description: 'The Uri for image respository is undefined'
                }));
            }
            return imageStoreUriExits(uri);
        }).then(uri => {
            resolve(uri);
        }).catch(err => {
            reject($rej(err, imageStoreUri.name));
        });
    });
}