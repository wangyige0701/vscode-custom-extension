import { Uri, FileType, Disposable } from "vscode";
import { createExParamPromise, delay, getHashCode, queueCreate } from "../utils";
import { 
    createBuffer, 
    imageToBase64, 
    newUri, 
    readDirectoryUri, 
    readFileUri, 
    uriDelete, 
    writeFileUri
} from "../utils/file";
import { selectFile, setStatusBarResolve, showProgress } from "../utils/interactive";
import { WError, errlog, promiseReject } from "../error";
import { backgroundImageConfiguration } from "../workspace/background";
import { 
    changeLoadState, 
    imageStoreUri, 
    isChangeBackgroundImage, 
    isWindowReloadToLoadBackimage, 
    setBackgroundImageSuccess 
} from "./utils";
import { backgroundSendMessage } from "./execute_webview";
import { checExternalDataIsRight, deletebackgroundCssFileModification, setSourceCssImportInfo } from "./modify";
import { bufferAndCode, codeChangeType } from "./type";
import { bisectionAsce } from "../utils/algorithm";
import { randomSettingBackground } from "./modifyRandom";

/** 图片类型过滤规则 */
const imageFilters = { 'Images': ['png', 'jpg', 'jpeg', 'gif', 'webp'] };

/** 背景图片哈希码数据列表 */
const backgroundImageCodeList: string[] = [];

// 初始化缓存数组数据
refreshImageCodeList();

/** 选择文件的默认路径 */
var selectFileDefaultPath = backgroundImageConfiguration.getBackgroundSelectDefaultPath();

/** 储存哈希码和图片base64数据的键值对 */
const repositoryData: { [key: string]: string } = {};

/** 背景图是否校验完成判断，完成后才能进行列表初始化 */
const isBackgroundCheckComplete: {
    /** 是否校验完成 */
    check: boolean;
    /** 是否需要初始化 */
    init: boolean;
    /** 是否正在初始化中 */
    running: boolean
} = {
    check: false,
    init: false,
    running: false
}

/** 设置图片哈希码缓存数据的执行队列对象 */
const backImgCodeSetQueue = queueCreate();

/** 从工作区中获取储存的哈希码数据并更新至缓存数组中 */
function refreshImageCodeList () {
    // 更新储存列表数据
    let cache: string[] | null = backgroundImageConfiguration.getBackgroundAllImageCodes();
    backgroundImageCodeList.length = cache.length;
    cache.forEach((item, index) => {
        if (backgroundImageCodeList[index] !== item) {
            backgroundImageCodeList[index] = item;
        }
    });
    cache = null;
}

/** vscode初始化后检测背景配置是否完整 */
export async function WindowInitCheckCssModifyCompleteness () {
    // 检查css文件是否正确
	await checkImageCssDataIsRight().then(state => {
		if (state) {
            // 需要重启应用背景
			isWindowReloadToLoadBackimage('背景图设置文件被修改或删除，需要重启窗口以应用背景');
        }
	}).catch(err => {
		errlog(err);
	});
    return Promise.resolve();
}

/**
 * vscode开始运行后插件启动时调用，
 * 校验外部css文件和源css文件是否删除背景图相关配置内容，
 * 返回true代表其中一个文件被修改或删除，需要重启窗口应用样式
 */
export function checkImageCssDataIsRight (): Promise<boolean> {
    return new Promise((resolve, reject) => {
        isBackgroundCheckComplete.check = true;
        let statusBarTarget: Disposable | null = setStatusBarResolve({
            icon: 'loading~spin',
            message: '背景图文件校验中'
        });
        Promise.resolve(<Promise<void>>new Promise((resolve) => {
            const isBack = backgroundImageConfiguration.getBackgroundIsSetBackground();
            if (!isBack) {
                // 当前没有设置背景图，则直接跳出检测
                throw { jump: true, data: false };
            } else {
                resolve();
            }
        })).then(() => {
            return setSourceCssImportInfo(true);
        }).then((res) => {
            return createExParamPromise(checExternalDataIsRight(), false || res.modify);
        }).then(([res, state]) => {
            state = state || res.modify;
            // 更新load加载状态缓存信息，state为false即不需要重启窗口应用背景时更新
            if (!state) {
                changeLoadState();
            }
            resolve(state);
        }).catch(err => {
            if (err.jump) {
                resolve(err.data);
            } else {
                reject(promiseReject(err, 'checkImageCssDataIsRight'));
            }
        }).finally(() => {
            statusBarTarget?.dispose();
            statusBarTarget = null;
            // 状态栏提示信息
            setBackgroundImageSuccess('背景图文件校验完成');
            isBackgroundCheckComplete.check = false;
            executeInitFunc();
        });
    });
}

/** 根据对象判断是否需要再次执行初始化函数 */
function executeInitFunc () {
    if (isBackgroundCheckComplete.init) {
        backgroundImageDataInit();
    }
}

/**
 * 删除一张图片，不需要判断是否被设置了背景图，图片被删除后背景图样式保持，直到下一次重新设置
 * @param messageSend 
 * @param webview 
 * @param code 
 */
export function deleteImage (...code: string[]) {
    isChangeBackgroundImage(code.length > 0 ? '是否删除选中图片' : '是否删除此图片').then(() => {
        showProgress({
            location: 'Notification',
            title: '图片删除中'
        }, (progress) => <Promise<void>>new Promise(resolve => {
            const array: Promise<string>[] = [];
            code.forEach(item => {
                array.push(deleteFileStore(item));
            });
            Promise.all(array).then(target => {
                backgroundSendMessage({
                    name: 'deleteImageSuccess',
                    value: target
                });
                progress.report({
                    message: '删除成功',
                    increment: 100
                });
                // 延迟关闭进度条
                return delay(1500);
            }).catch(err => {
                errlog(err);
            }).finally(() => {
                resolve();
            });
        }));
    }).catch(error => {
        errlog(error);
    });
}

/** 清除背景图相关设置 */
export function clearBackgroundConfig () {
    isChangeBackgroundImage('是否清除背景图配置').then(() => {
        return Promise.resolve(clearBackgroundConfigExecute());
    }).then(() => {
        if (backgroundImageConfiguration.getBackgroundIsRandom()) {
            // 如果当前设置了随机切换，需要关闭
            randomSettingBackground(false, false);
        }
    }).catch(error => {
        errlog(error);
    });
}

/** 执行配置清除方法 */
export function clearBackgroundConfigExecute () {
    return showProgress({
        location: 'Notification',
        title: '清除中'
    }, (progress) => <Promise<void>>new Promise(resolve => {
        deletebackgroundCssFileModification().then(() => {
            progress.report({
                message: '清除成功',
                increment: 100
            });
            return delay(1500);
        }).catch(err => {
            errlog(err);
        }).finally(() => {
            resolve();
        });
    }));
}

/** 侧栏webview页面从本地文件选择背景图 */
export function selectImage () {
    // 需要发送的数据
    let sendMsg: string[] = [];
    selectFile({
        many: true,
        files: true,
        filters: imageFilters,
        defaultUri: selectFileDefaultPath
    }).then(({ uri, dirName }) => {
        return <Promise<Uri[]>>new Promise((resolve, reject) => {
            // 选择一次文件后保存默认选择路径
            Promise.resolve(
                backgroundImageConfiguration.setBackgroundSelectDefaultPath(selectFileDefaultPath = dirName)
            ).then(() => {
                resolve(uri);
            }).catch(err => {
                reject(promiseReject(err, 'selectImage > selectFile'));
            });
        });
    }).then(uris => {
        return Promise.all(
            uris.map(uri => imageToBase64(uri.fsPath))
        );
    }).then(base64s => {
        return Promise.all(
            base64s.map(base64 => createFileStore(base64))
        );
    }).then(datas => {
        datas.forEach(hashCode => {
            sendMsg.push(hashCode);
        });
    }).catch(err => {
        errlog(err, true);
    }).finally(() => {
        backgroundSendMessage({
            name: 'newImage',
            value: sendMsg
        });
    });
}

/**
 * webview首次加载或者重置储存路径时获取储存背景图片数据，获取当前设置的背景图哈希码并将其发送给webview页面；
 * 每次调用会重置缓存对象，从对应路径获取图片数据并依次更新缓存
 */
export function backgroundImageDataInit () {
    // 正则执行背景图校验或者正在执行初始化函数，则修改状态，等待完成后再次执行
    if (isBackgroundCheckComplete.check || isBackgroundCheckComplete.running) {
        isBackgroundCheckComplete.init = true;
        return;
    }
    // 开始执行
    isBackgroundCheckComplete.running = true;
    // 关闭状态
    isBackgroundCheckComplete.init = false;
    let length: number = 0,
    success: boolean = false,
    /** 状态栏显示提示 */
    statusBarTarget: Disposable|null = setStatusBarResolve({
        icon: 'loading~spin',
        message: '侧栏列表初始化中'
    });
    refreshImageCodeList();
    // 重置repositoryData数据
    for (let name in repositoryData) {
        delete repositoryData[name];
    }
    // 检索数据
    selectAllImage().then(({ files, uri }) => {
        return checkImageFile(files, uri);
    }).then(buffers => {
        return changeToString(buffers);
    }).then(str => {
        return refreshBackgroundImageList(str);
    }).then(str => {
        backgroundSendMessage({
            name: 'backgroundInitData',
            value: str
        });
        success = true;
        length = str.length;
    }).then(() => {
        // 通过缓存获取图片哈希码发送
        const state = backgroundImageConfiguration.getBackgroundIsSetBackground();
        if (state) {
            backgroundSendMessage({
                name: 'settingBackgroundSuccess',
                value: backgroundImageConfiguration.getBackgroundNowImageCode()
            });
        }
    }).then(() => {
        // 发送当前透明度
        backgroundSendMessage({
            name: 'nowBackgroundOpacity',
            value: backgroundImageConfiguration.getBackgroundOpacity()
        });
    }).catch(err => {
        errlog(err);
        if (!success) {
            // 出错判断初始化数据有没有发送
            backgroundSendMessage({
                name: 'backgroundInitData',
                value: []
            });
        }
    }).finally(() => {
        // 获取当前随机设置背景图的状态，发送响应消息
        backgroundSendMessage({
            name: 'backgroundRandomList',
            value: backgroundImageConfiguration.getBackgroundIsRandom() ? 
                backgroundImageConfiguration.getBackgroundRandomList() : 
                false
        });
        statusBarTarget?.dispose();
        statusBarTarget = null;
        // 延迟指定时间后修改状态栏信息，仅当图片数量大于0时显示
        if (length > 0) setBackgroundImageSuccess('背景图列表初始化成功');
        isBackgroundCheckComplete.running = false;
        executeInitFunc();
    });
}

/**
 * 根据传入的哈希码发送对应图片base64数据
 * @param options 需要获取数据的哈希码以及传递的类型，用于webview侧判断哪边调用 
 */
export function getBase64DataByCode ({ code, type }: { code: string, type: string }): void {
    if (repositoryData.hasOwnProperty(code)) {
        backgroundSendMessage({
            name: 'backgroundSendBase64Data',
            value: { code, data: repositoryData[code], type }
        });
    }
}

/** 从储存对象中根据哈希码获取base64数据 */
export function getBase64DataFromObject (code: string): string {
    if (repositoryData.hasOwnProperty(code)) {
        return repositoryData[code];
    } else {
        return '';
    }
}

/**
 * 将从储存路径下读取的图片base64数据和对应哈希码一起返回
 * @param buffers 
 */
function changeToString (buffers: bufferAndCode[]): Promise<string[]> {
    return new Promise((resolve, reject) => {
        try {
            const result: string[] = [];
            buffers.forEach(buff => {
                result.push(buff.code);
                // 校验当前哈希码是否存在于缓存列表中
                codeListRefresh(buff.code, 'check', buff.buffer.toString());
            });
            resolve(result);
        } catch (error) {
            reject(promiseReject(error, 'changeToString'));
        }
    });
}

/** 缓存哈希码新增操作 */
function codeAdd (code: string, data: string): Promise<void> {
    return new Promise(resolve => {
        // 新增，创建code时进行检验，现在一定不会重复
        backgroundImageCodeList.unshift(code);
        // 储存对象添加一条数据
        repositoryData[code] = data??'';
        // 放入队列待执行
        let copyBackImgCodeList: undefined | string[] = [...backgroundImageCodeList];
        backImgCodeSetQueue.set((): Promise<void> => new Promise(($res, $rej) => {
            Promise.resolve(
                backgroundImageConfiguration.refreshBackgroundImagePath(copyBackImgCodeList!)
            ).then(() => {
                copyBackImgCodeList = undefined;
                refreshImageCodeList();
            }).then(() => {
                $res();
            }).catch(err => {
                $rej(promiseReject(err, 'codeDelete'));
            });
        }));
        resolve();
    });
}

/** 缓存哈希码删除操作 */
function codeDelete (code: string): Promise<void> {
    return new Promise(resolve => {
        // 删除判断是否存在索引
        let index = backgroundImageCodeList.findIndex(item => item === code);
        // 删除缓存数组内的数据
        if (index >= 0) backgroundImageCodeList.splice(index, 1);
        // 删除存储对象中的base64数据
        if (repositoryData.hasOwnProperty(code)) delete repositoryData[code];
        // 更新缓存数组
        let copyBackImgCodeList: undefined | string[] = [...backgroundImageCodeList];
        backImgCodeSetQueue.set((): Promise<void> => new Promise(($res, $rej) => {
            Promise.resolve().then(() => {
                // 判断删除图片是否在随机切换数组中
                const randomList = backgroundImageConfiguration.getBackgroundRandomList();
                if (randomList.length > 0 && randomList.includes(code)) {
                    // 如果在，则更新随机数组，将删除掉的哈希码去除
                    return Promise.resolve(backgroundImageConfiguration.setBackgroundRandomList(
                        randomList.splice(randomList.findIndex(item => item === code, 1))
                    ));
                }
            }).then(() => {
                // 如果对储存数据进行了修改则更新当前缓存对象
                return Promise.resolve(
                    backgroundImageConfiguration.refreshBackgroundImagePath(copyBackImgCodeList!)
                );
            }).then(() => {
                copyBackImgCodeList = undefined;
                refreshImageCodeList();
            }).then(() => {
                $res();
            }).catch(err => {
                $rej(promiseReject(err, 'codeDelete'));
            });
        }));
        resolve();
    });
}

/** 缓存哈希码检查操作 */
function codeCheck (code: string, data: string): Promise<void> {
    return new Promise((resolve, reject) => {
        let index = backgroundImageCodeList.findIndex(item => item === code);
        Promise.resolve().then(() => {     
            if (index < 0) {
                // 缓存数组中不存在，需要添加
                return codeListRefresh(code, 'add', data);
            } else {
                // 否则直接在储存对象添加一条数据
                repositoryData[code] = data??'';
            }
        }).then(() => {
            resolve();
        }).catch(err => {
            reject(promiseReject(err, 'codeCheck'));
        });
    });
}

/**
 * 对哈希码数据缓存数组进行更新操作
 * @param code 
 * @param state 
 */
function codeListRefresh (code: string, state: codeChangeType = 'add', addData: string|undefined = undefined): Promise<void> {
    if (state === 'add') {
        return codeAdd(code, addData!);
    } else if (state === 'delete') {
        return codeDelete(code);
    } else if (state === 'check') {
        return codeCheck(code, addData!);
    } else {
        return Promise.resolve();
    }
}

/**
 * 判断列表中是否含有此图片哈希码
 * @param code 
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
function refreshBackgroundImageList (data: string[]): Promise<string[]> {
    return new Promise((resolve, reject) => {
        let cacheData: string[] | null = backgroundImageConfiguration.getBackgroundAllImageCodes();
        if (data.length === cacheData.length) {
            resolve(data);
            return;
        }
        Promise.resolve().then(() => {
            // 新数组长度等于缓存数组长度，直接返回
            if (data.length > cacheData!.length) {
                // 比缓存数组长则需要添加数据（一般不会出现）
                return compareCodeList(data, cacheData!, 'add');
            } else if (data.length < cacheData!.length) {
                // 短则需要删除数据
                return compareCodeList(cacheData!, data, 'delete');
            } else {
                return Promise.resolve();
            }
        }).then(() => {
            resolve(data);
        }).catch(err => {
            reject(promiseReject(err, 'refreshBackgroundImageList'));
        }).finally(() => {
            cacheData = null;
        });
    });
}

/**
 * 新旧数组进行比较，因为是比较哈希码，不存在数组元素重复的问题
 * @param long 长一点的数组，用于校验
 * @param short 短一点的数组
 */
async function compareCodeList (long: string[], short: string[], type: 'add' | 'delete' = 'add'): Promise<void> {
    for (let i = 0; i < long.length; i++) {
        const item = long[i], index = short.findIndex(i => i === item);
        // 直接使用字符串进行操作，因为删除一个数据后再传索引对应的数据会不正确
        if (index < 0) {
            await backgroundImageConfiguration.setBackgroundAllImageCodes(item, type).catch(err => {
                return Promise.reject(promiseReject(err, 'compareCodeList'));
            });
        }
    }
    refreshImageCodeList();
    return Promise.resolve();
}

/**
 * 校验储存图片base64数据的文件并进行读取
 * @param files 指定目录下的所有文件列表
 * @param uri 
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
                    // 需要加一个index为-1的判断，防止递归死循环
                    const posi = index >= 0 ? bisectionAsce(checkArray, index) : 0;
                    checkArray.splice(posi, 0, index);
                    fileRequest.splice(posi, 0, getFileAndCode(newUri(uri, file), reg[1]));
                }
            }
            Promise.all(fileRequest).then(res => {
                resolve(res);
            }).catch(err => {
                reject(promiseReject(err, 'checkImageFile'));
            });
        } catch (error) {
            reject(promiseReject(error, 'checkImageFile'));
        }
    });
}

/**
 * 返回.wyg图片文件的base64数据和对应哈希码
 * @param uri 
 * @param code 
 */
function getFileAndCode (uri: Uri, code: string): Promise<bufferAndCode> {
    return new Promise((resolve, reject) => {
        readFileUri(uri).then(res => {
            resolve({
                buffer: res,
                code
            });
        }).catch(err => {
            reject(promiseReject(err, 'getFileAndCode'));
        });
    });
}

/** 获取背景图目录下的所有文件，并校验路径下的文件夹是否存在 */
function selectAllImage (): Promise<{ files: [string, FileType][], uri: Uri }> {
    return new Promise((resolve, reject) => {
        imageStoreUri().then(uri => {
            if (!uri) {
                throw new WError('Undefined Uri', {
                    position: 'Parameter',
                    FunctionName: 'selectAllImage > imageStoreUri',
                    ParameterName: 'uri',
                    description: 'The Uri of image folder is undefined'
                });
            }
            return createExParamPromise(readDirectoryUri(uri), uri);
        }).then(([res, uri]) => {
            resolve({ files: res, uri });
        }).catch(err => {
            reject(promiseReject(err, 'selectAllImage'));
        });
    });
}

/** 生成一个没有重复的哈希码 */
function newHashCode (): string {
    let code: string = getHashCode();
    if (hasHashCode(code)) {
        code = newHashCode();
    }
    return code;
}

/** 创建.wyg文件储存图片文件，文件格式是 (哈希码.back.wyg) */
export function createFileStore (base64: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const code: string = newHashCode();
        imageStoreUri().then(uri => {
            if (!uri) {
                throw new WError('Undefined Uri', {
                    position: 'Parameter',
                    FunctionName: 'createFileStore > imageStoreUri',
                    ParameterName: 'uri',
                    description: 'The Uri of image folder is undefined'
                });
            }
            uri = newUri(uri, code+'.back.wyg');
            return writeFileUri(uri, createBuffer(base64));
        }).then(() => {
            // 新增一个哈希码数据
            return codeListRefresh(code, 'add', base64.toString());
        }).then(() => {
            resolve(code);
        }).catch(err => {
            reject(promiseReject(err, 'createFileStore'));
        });
    });
}

/**
 * 根据哈希码删除.wyg图片文件
 * @param code 需要删除图片的哈希码
 */
function deleteFileStore (code: string): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!hasHashCode(code)) {
            reject(new WError('Undefined Hash Code', {
                position: 'Parameter',
                FunctionName: 'deleteFileStore',
                ParameterName: 'code',
                description: 'The hash code to delete image is undefined'
            }));
            return;
        }
        imageStoreUri().then(uri => {
            if (!uri) {
                throw new WError('Undefined Uri', {
                    position: 'Parameter',
                    FunctionName: 'deleteFileStore > imageStoreUri',
                    ParameterName: 'uri',
                    description: 'The Uri of image folder is undefined'
                });
            }
            uri = newUri(uri, `${code}.back.wyg`);
            return uriDelete(uri);
        }).then(() => {
            return codeListRefresh(code, 'delete');
        }).then(() => {
            resolve(code);
        }).catch(err => {
            reject(promiseReject(err, 'deleteFileStore'));
        });
    });
}