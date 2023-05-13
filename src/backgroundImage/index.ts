import { Uri, FileType } from "vscode";
import { delay, getHashCode } from "../utils";
import { createBuffer, imageToBase64, newUri, readDirectoryUri, readFileUri, uriDelete, writeFileUri } from "../utils/file";
import { selectFile, showProgress } from "../utils/interactive";
import { errHandle } from "../error";
import { backgroundImageConfiguration } from "../workspace/background";
import { changeLoadState, imageStoreUri, isChangeBackgroundImage, isWindowReloadToLoadBackimage, setBackgroundImageSuccess } from "./utils";
import { backgroundSendMessage } from "./execute";
import { checExternalDataIsRight, checkCurentImageIsSame, modifyCssFileForBackground, setSourceCssImportInfo } from "./modify";
import { bufferAndCode, codeChangeType } from "./data";

/**
 *  图片类型过滤规则
 */
const imageFilters = { 'Images': ['png', 'jpg', 'jpeg', 'gif', 'webp'] };

/**
 * 背景图片哈希码数据列表
 */
const backgroundImageCodeList: string[] = [];

/**
 * 选择文件的默认路径
 */
var selectFileDefaultPath = backgroundImageConfiguration.getBackgroundSelectDefaultPath();

/**
 * vscode初始化后检测背景配置是否完整
 */
export function WindowInitCheckCssModifyCompleteness () {
    // 检查css文件是否正确
	checkImageCssDataIsRight().then(state => {
		if (state) {
			// 需要重启应用背景
			isWindowReloadToLoadBackimage('背景图设置文件被修改或删除，需要重启窗口以应用背景');
		}
	}).catch(err => {
		errHandle(err);
	});
}

/**
 * vscode开始运行后插件启动时调用，
 * 校验外部css文件和源css文件是否删除背景图相关配置内容，
 * 返回true代表其中一个文件被修改或删除，需要重启窗口应用样式
 */
export function checkImageCssDataIsRight (): Promise<boolean> {
    return new Promise((resolve, reject) => {
        try {
            const isBack = backgroundImageConfiguration.getBackgroundIsSetBackground();
            if (!isBack) {
                // 当前没有设置背景图，则直接跳出检测
                throw { jump: true, data: false };
            }
            let state = false;
            setSourceCssImportInfo().then((res) => {
                state = state || res.modify;
                return checExternalDataIsRight();
            }).then((res) => {
                state = state || res.modify;
                // 状态栏提示信息
                setBackgroundImageSuccess('背景图文件校验完成');
                // 更新load加载状态缓存信息，state为false即不需要重启窗口应用背景时更新
                if (!state) changeLoadState();
                resolve(state);
            }).catch(err => {
                if (err.jump) {
                    resolve(err.data);
                } else {
                    reject(err);
                }
            });
        } catch (error) {
            errHandle(error);
        }
    });
}

/**
 * webview端点击图片设置背景图处理方法
 * @param param 传入点击图片的哈希码和在webview列表中的索引位置
 */
export function settingImage ({ code, index }: {
    code: string;
    index: number;
}) {
    isChangeBackgroundImage().then(() => {
        showProgress({
            location: 'Notification',
            title: '背景图设置中'
        }, (progress) => {
            return <Promise<void>>new Promise((resolve) => {
                modifyCssFileForBackground(code).then(() => {
                    backgroundSendMessage({
                        name: 'settingBackgroundSuccess',
                        value: index
                    });
                    progress.report({
                        message: '设置成功',
                        increment: 100
                    });
                    // 延迟500毫秒关闭进度条
                    return delay(500);
                }).then(() => {
                    isWindowReloadToLoadBackimage();
                }).catch(err => {
                    throw err;
                }).finally(() => {
                    resolve();
                });
            });
        });
    }).catch((error) => {
        errHandle(error);
    });
}

/**
 * 删除一张图片，不需要判断是否被设置了背景图，图片被删除后背景图样式保持，直到下一次重新设置
 * @param messageSend 
 * @param webview 
 * @param code 
 */
export function deleteImage (code: string) {
    isChangeBackgroundImage('是否删除当前图片').then(() => {
        showProgress({
            location: 'Notification',
            title: '图片删除中'
        }, (progress) => {
            return <Promise<void>>new Promise((resolve) => {
                deleteFileStore(code).then(target => {
                    backgroundSendMessage({
                        name: 'deleteImageSuccess',
                        value: target
                    });
                    progress.report({
                        message: '删除成功',
                        increment: 100
                    });
                    // 延迟1秒关闭进度条
                    return delay(1500);
                }).catch(err => {
                    throw err;
                }).finally(() => {
                    resolve();
                });
            });
        });
    }).catch(error => {
        errHandle(error);
    });
}

/**
 * 侧栏webview页面从本地文件选择背景图
 * @param messageSend 
 * @param webview 
 */
export function selectImage () {
    selectFile({
        many: true,
        files: true,
        filters: imageFilters,
        defaultUri: selectFileDefaultPath
    }).then(({ uri, dirName }) => {
        // 选择一次文件后保存默认选择路径
        backgroundImageConfiguration.setBackgroundSelectDefaultPath(selectFileDefaultPath = dirName);
        return imageToBase64(uri[0].fsPath);
    }).then(base64 => {
        return createFileStore(base64);
    }).then(({ hashCode, base64 }) => {
        backgroundSendMessage({
            name: 'newImage',
            value: [base64, hashCode]
        });
    }).catch(err => {
        errHandle(err);
    });
}

/**
 * webview首次加载时获取储存背景图片数据，获取当前设置的背景图哈希码并将其发送给webview页面
 * @param messageSend 
 * @param webview 
 */
export function backgroundImageDataInit () {
    selectAllImage().then(({ files, uri }) => {
        return checkImageFile(files, uri);
    }).then(buffers => {
        return changeToString(buffers);
    }).then(str => {
        refreshGlobalBackgroundImageList();
        backgroundSendMessage({
            name: 'backgroundInitData',
            value: str
        });
        // 判断已选中的图片
        return checkCurentImageIsSame(backgroundImageConfiguration.getBackgroundNowImagePath());
    }).then(data => {
        if (data.state) {
            backgroundSendMessage({
                name: 'settingBackgroundSuccess',
                value: data.code as string
            });
            setBackgroundImageSuccess('侧栏图片列表初始化成功');
        }
    }).catch(err => {
        errHandle(err);
    });
}

/**
 * 将读取的图片字符串数据和对应哈希码一起返回
 * @param buffers 
 * @returns {Promise<string[][]>}
 */
function changeToString (buffers: bufferAndCode[]): Promise<string[][]> {
    return new Promise(resolve => {
        try {
            const result: string[][] = buffers.map(buff => {
                codeListRefresh(buff.code);
                return [buff.buffer.toString(), buff.code];
            });
            resolve(result);
        } catch (error) {
            errHandle(error);
        }
    });
}

/**
 * 对哈希码数据缓存数组进行更新操作
 * @param code 
 * @param state 
 */
function codeListRefresh (code: string, state: codeChangeType='add') {
    const index = backgroundImageCodeList.findIndex(item => item === code);
    if (state === 'add' && index < 0) {
        // 新增判断是否有重复值
        backgroundImageCodeList.push(code);
        backgroundImageConfiguration.setBackgroundAllImagePath(code);
    } else if (state === 'delete' && index >= 0) {
        // 删除判断是否存在索引
        backgroundImageCodeList.splice(index, 1);
        backgroundImageConfiguration.setBackgroundAllImagePath(code, 'delete');
    }
}

/**
 * 判断列表中是否含有此图片哈希码
 * @param code 
 * @returns {boolean}
 */
function hasHashCode (code: string): boolean {
    return backgroundImageCodeList.includes(code);
}

/**
 * 比较缓存数据和新数据是否相同并更新
 */
function refreshGlobalBackgroundImageList () {
    if (compareCodeList(
        backgroundImageConfiguration.getBackgroundAllImagePath(), 
        backgroundImageCodeList
    )) return;
    // 如果不相同，将缓存数据更新为当前数组数据
    backgroundImageConfiguration.refreshBackgroundImagePath(backgroundImageCodeList)
}

/**
 * 新旧数组进行比较，因为是比较哈希码，不存在数组元素重复的问题
 */
function compareCodeList (oldData: string[], newData: string[]): boolean {
    if (oldData.length !== newData.length) return false;
    for (let i = 0; i < newData.length; i++) {
        const code = newData[i];
        const index = oldData.findIndex(item => item === code);
        if (index === -1) {
            return false;
        }
    }
    return true;
}

/**
 * 校验储存图片base64数据的文件并进行读取
 * @param files 指定目录下的所有文件列表
 * @param uri 
 * @returns {Promise<bufferAndCode[]>}
 */
function checkImageFile (files: [string, FileType][], uri: Uri): Promise<bufferAndCode[]> {
    return new Promise((resolve, reject) => {
        try {
            const fileRequest: Array<Promise<{ buffer: Uint8Array, code: string }>> = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i][0];
                // 对满足要求的文件进行文件数据读取
                const reg = file.match(/(.*?).back.wyg$/);
                if (reg) {
                    fileRequest.push(getFileAndCode(newUri(uri, file), reg[1]));
                }
            }
            Promise.all(fileRequest).then(res => {
                resolve(res);
            }).catch(err => {
                reject(err);
            });
        } catch (error) {
            errHandle(error);
        }
    });
}

/**
 * 返回.wyg图片文件的base64数据和对应哈希码
 * @param uri 
 * @param code 
 * @returns {Promise<bufferAndCode>}
 */
function getFileAndCode (uri: Uri, code: string): Promise<bufferAndCode> {
    return new Promise((resolve, reject) => {
        try {
            readFileUri(uri).then(res => {
                resolve({
                    buffer: res,
                    code
                });
            }).catch(err => {
                reject(err);
            });
        } catch (error) {
            errHandle(error);
        }
    });
}

/**
 * 获取背景图目录下的所有文件
 * @returns {Promise<{ files: [string, FileType][], uri: Uri }>}
 */
function selectAllImage (): Promise<{ files: [string, FileType][], uri: Uri }> {
    return new Promise((resolve, reject) => {
        try {
            const uri = imageStoreUri();
            if (!uri) throw new Error('null uri');
            readDirectoryUri(uri).then(res => {
                resolve({ files: res, uri });
            }).catch(err => {
                throw err;
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 生成一个没有重复的哈希码
 * @returns 
 */
function newHashCode (): string {
    let code = getHashCode();
    if (hasHashCode(code)) code = newHashCode();
    return code;
}

/**
 * 创建.wyg文件储存图片文件，文件格式是 (哈希码.back.wyg)
 * @returns {Promise<{hashCode:string, base64:string}>}
 */
function createFileStore (base64: string): Promise<{hashCode:string, base64:string}> {
    return new Promise((resolve, reject) => {
        try {
            let uri = imageStoreUri();
            if (!uri) throw new Error('null uri');
            const code = newHashCode();
            uri = newUri(uri, code+'.back.wyg');
            writeFileUri(uri, createBuffer(base64)).then(() => {
                // 新增一个哈希码数据
                codeListRefresh(code);
                resolve({ hashCode: code, base64: base64 });
            }).catch(err => {
                throw err;
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 根据哈希码删除.wyg图片文件
 * @param code 
 * @returns {Promise<string>}
 */
function deleteFileStore (code: string): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            if (!hasHashCode(code)) throw new Error('null hash code');
            let uri = imageStoreUri();
            if (!uri) throw new Error('null uri');
            uri = newUri(uri, `${code}.back.wyg`);
            uriDelete(uri).then(() => {
                codeListRefresh(code, 'delete');
                resolve(code);
            }).catch(err => {
                throw err;
            });
        } catch (error) {
            reject(error);
        }
    });
}