import { Uri, FileType } from "vscode";
import { delay, getHashCode } from "../utils";
import { createBuffer, imageToBase64, newUri, readDirectoryUri, readFileUri, uriDelete, writeFileUri } from "../utils/file";
import { selectFile, showProgress } from "../utils/interactive";
import { errHandle } from "../error";
import { backgroundImageConfiguration } from "../workspace/background";
import { changeLoadState, imageStoreUri, isChangeBackgroundImage, isWindowReloadToLoadBackimage, setBackgroundImageSuccess, setBackgroundInfoOnStatusBar } from "./utils";
import { backgroundSendMessage } from "./execute";
import { checExternalDataIsRight, checkCurentImageIsSame, modifyCssFileForBackground, setSourceCssImportInfo } from "./modify";
import { bufferAndCode, codeChangeType } from "./data";
import { bisectionAsce } from "../utils/algorithm";

/**
 *  图片类型过滤规则
 */
const imageFilters = { 'Images': ['png', 'jpg', 'jpeg', 'gif', 'webp'] };

/**
 * 背景图片哈希码数据列表
 */
const backgroundImageCodeList: string[] = backgroundImageConfiguration.getBackgroundAllImagePath();

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
            return <Promise<void>>new Promise((resolve, reject) => {
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
                    reject(err);
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
            return <Promise<void>>new Promise((resolve, reject) => {
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
                    reject(err);
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
    // 需要发送的数据
    let sendMsg: [string, string] | undefined = undefined;
    selectFile({
        many: false,
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
        sendMsg = [base64, hashCode];
    }).catch(err => {
        errHandle(err, true);
    }).finally(() => {
        backgroundSendMessage({
            name: 'newImage',
            value: sendMsg
        });
    });
}

/**
 * webview首次加载时获取储存背景图片数据，获取当前设置的背景图哈希码并将其发送给webview页面
 * @param messageSend 
 * @param webview 
 */
export function backgroundImageDataInit () {
    let length: number = 0;
    selectAllImage().then(({ files, uri }) => {
        return checkImageFile(files, uri);
    }).then(buffers => {
        return changeToString(buffers);
    }).then(str => {
        refreshBackgroundImageList(str.map(item => item[1]));
        backgroundSendMessage({
            name: 'backgroundInitData',
            value: str
        });
        length = str.length;
        // 判断已选中的图片
        return checkCurentImageIsSame(backgroundImageConfiguration.getBackgroundNowImagePath());
    }).then(data => {
        if (data.state) {
            backgroundSendMessage({
                name: 'settingBackgroundSuccess',
                value: data.code as string
            });
            // 发送当前透明度
            backgroundSendMessage({
                name: 'nowBackgroundOpacity',
                value: backgroundImageConfiguration.getBackgroundOpacity()
            });
            // 延迟指定时间后修改状态栏信息
            setBackgroundInfoOnStatusBar('侧栏列表初始化中', 'loading~spin', length * 500, () => {
                setBackgroundImageSuccess('侧栏列表初始化成功');
            });
        }
    }).catch(err => {
        errHandle(err);
    });
}

/**
 * 将从储存路径下读取的图片base64数据和对应哈希码一起返回
 * @param buffers 
 * @returns {Promise<string[][]>}
 */
function changeToString (buffers: bufferAndCode[]): Promise<string[][]> {
    return new Promise(resolve => {
        try {
            const result: string[][] = buffers.map(buff => {
                // 校验当前哈希码是否存在于缓存列表中
                codeListRefresh(buff.code, 'check');
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
    // 缓存数组是否需要被更改
    let modify: boolean = false;
    if (state === 'add') {
        // 新增，创建code时进行检验，现在一定不会重复
        backgroundImageCodeList.unshift(code);
        modify = true;
    } else if (state === 'delete') {
        // 删除判断是否存在索引
        const index = backgroundImageCodeList.findIndex(item => item === code);
        backgroundImageCodeList.splice(index, 1);
        modify = true;
    } else if (state === 'check') {
        const index = backgroundImageCodeList.findIndex(item => item === code);
        if (index < 0) {
            // 缓存数组中不存在，需要添加
            codeListRefresh(code, 'add');
        }
    }
    if (modify)
        backgroundImageConfiguration.refreshBackgroundImagePath(backgroundImageCodeList);
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
 * 比较缓存数据和新数据是长度否相同，不相同则表明储存路径下可能有文件被删除，需要更新缓存数组。
 * 在上一步操作中，对从目录下获取的数据进行map处理时有完成校验，
 * 如果路径下有新数据是缓存数组中没有的则会往数组内push一个新的哈希码。
 * 所以如果此时两个数组长度不同，则一定是缓存数组长于新数组，有数据被删除。
 * 但在此方法中，对缓存数组长度大于和小于新数组长度都进行处理
 */
function refreshBackgroundImageList (data: string[]) {
    let cacheData: string[] | null = backgroundImageConfiguration.getBackgroundAllImagePath();
    // 新数组长度等于缓存数组长度，直接返回
    if (data.length === cacheData.length) return;
    if (data.length > cacheData.length) {
        // 比缓存数组长则需要添加数据（一般不会出现）
        compareCodeList(data, cacheData);
    } else {
        // 短则需要删除数据
        compareCodeList(cacheData, data, 'delete');
    }
    cacheData = null;
}

/**
 * 新旧数组进行比较，因为是比较哈希码，不存在数组元素重复的问题
 * @param long 长一点的数组，用于校验
 * @param short 短一点的数组
 */
function compareCodeList (long: string[], short: string[], type: 'add' | 'delete' = 'add'): void {
    for (let i = 0; i < long.length; i++) {
        const item = long[i], index = short.findIndex(i => i === item);
        if (index < 0) {
            // 直接使用字符串进行操作，因为删除一个数据后再传索引对应的数据会不正确
            backgroundImageConfiguration.setBackgroundAllImagePath(item, type); 
        }
    }
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
            let checkArray: number[] = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i][0];
                // 对满足要求的文件进行文件数据读取
                const reg = file.match(/(.*?).back.wyg$/);
                if (reg) {
                    const index = backgroundImageCodeList.findIndex(item => item === reg[1]);
                    const posi = bisectionAsce(checkArray, index);
                    checkArray.splice(posi, 0, index);
                    fileRequest.splice(posi, 0, getFileAndCode(newUri(uri, file), reg[1]));
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
                reject(err);
            });
        } catch (error) {
            errHandle(error);
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
export function createFileStore (base64: string): Promise<{hashCode:string, base64:string}> {
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
                reject(err);
            });
        } catch (error) {
            errHandle(error);
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
                reject(err);
            });
        } catch (error) {
            errHandle(error);
        }
    });
}