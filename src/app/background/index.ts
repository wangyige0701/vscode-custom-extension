import type { Uri, FileType, Disposable } from "vscode";
import { createExParamPromise, delay, getHashCode, range } from "../../utils";
import { createBuffer, imageToBase64, newUri, readDirectoryUri, readFileUri, uriDelete, writeFileUri } from "../../utils/file";
import { selectFile, setStatusBarResolve, showProgress } from "../../utils/interactive";
import { WError, errlog, $rej } from "../../error";
import { BackgroundConfiguration } from "../../workspace/background";
import { changeLoadState, imageStoreUri, showMessageByModal, isWindowReloadToLoadBackimage, setBackgroundImageSuccess } from "./utils";
import { backgroundSendMessage } from "./executeWebview";
import { checExternalDataIsRight, deleteBackgroundCssFileModification, setSourceCssImportInfo } from "./modify";
import type { BackCheckComplete, CodeRefreshType, bufferAndCode, codeChangeType } from "./types";
import { bisectionAsce } from "../../utils/algorithm";
import { randomSettingBackground } from "./modifyRandom";
import { createCompressDirectory, deleteCompressByCode, getCompressImage } from "./compress";

/** 图片类型过滤规则 */
const imageFilters = { 'Images': ['png', 'jpg', 'jpeg', 'gif', 'webp'] };

/** 选择文件的默认路径 */
var selectFileDefaultPath = BackgroundConfiguration.getBackgroundSelectDefaultPath;

/** 背景图片哈希码数据数组 */
const backgroundImageCodeArray: string[] = [];

/** 储存哈希码和图片base64数据的键值对 */
const repositoryData = new Map<string, { origin: string; thumbnail: string; }>();

/** 背景图是否校验完成判断，完成后才能进行列表初始化 */
const isBackgroundCheckComplete: BackCheckComplete = {
    check: false,
    init: false,
    running: false
};

/** 从工作区中获取储存的哈希码数据并更新至缓存数组中 */
function refreshImageCodeList () {
    // 更新储存列表数据
    const cache: string[] = BackgroundConfiguration.getBackgroundAllImageCodes;
    backgroundImageCodeArray.length = cache.length;
    cache.forEach((item, index) => {
        if (backgroundImageCodeArray[index] !== item) {
            backgroundImageCodeArray[index] = item;
        }
    });
}

/** 获取缓存中的图片数据 */
function getRepositoryDataByCode (code: string, thumbnail: boolean = false): string {
    if (!repositoryData.has(code)) {
        return '';
    }
    const value = repositoryData.get(code);
    if (!thumbnail || (thumbnail && !value!.thumbnail)) {
        return value!.origin??'';
    }
    return value!.thumbnail??'';
}

/** 删除缓存 */
export function clearRepositoryWhenUninstall () {
    // 图片base64数据清除
    repositoryData.clear();
    // 图片哈希码数组清除
    backgroundImageCodeArray.splice(0, backgroundImageCodeArray.length);
}

/** vscode初始化后检测背景配置是否完整 */
export async function WindowInitCheckCssModifyCompleteness () {
    // 检查css文件是否正确
	await checkImageCssDataIsRight().then(state => {
		if (state) {
            // 需要重启应用背景
			isWindowReloadToLoadBackimage('检测到背景图配置修改或删除，当前状态可能为插件重装，如果需要重新应用背景请选择确认重启窗口');
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
        const statusBarTarget: Disposable = setStatusBarResolve({
            icon: 'loading~spin',
            message: '背景图文件校验中'
        });
        Promise.resolve(<Promise<void>>new Promise(($resolve, $reject) => {
            const isBack = BackgroundConfiguration.getBackgroundIsSetBackground;
            if (!isBack) {
                // 当前没有设置背景图，则直接跳出检测
                return $reject({ jump: true, data: false });
            }
            // promise完成
            $resolve();
        })).then(() => {
            // 设置了背景图则校验源文件是否写入了背景图导入语句
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
                return resolve(err.data);
            }
            reject($rej(err, checkImageCssDataIsRight.name));
        }).finally(() => {
            statusBarTarget?.dispose();
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
    showMessageByModal(code.length > 1 ? '是否删除选中图片' : '是否删除此图片').then(() => {
        return Promise.resolve(deleteImageProgress(...code));
    }).catch(err => {
        err && errlog(err);
    });
}

/** 图片删除的进度条 */
function deleteImageProgress (...codes: string[]) {
    return showProgress({
        location: 'Notification',
        title: '图片删除中'
    }, (progress) => <Promise<void>>new Promise(resolve => {
        Promise.all(codes.map(code => {
            return deleteFileStore(code);
        })).then(codes => {
            const randomList = BackgroundConfiguration.getBackgroundRandomList;
            for (const code of codes) {
                // 删除随机数组缓存的数据
                if (randomList.includes(code)) {
                    randomList.splice(randomList.indexOf(code), 1);
                }
                // 删除缓存数组内的数据
                if (hasHashCode(code)) {
                    backgroundImageCodeArray.splice(backgroundImageCodeArray.indexOf(code), 1);
                }
            }
            return createExParamPromise(
                Promise.all([
                    Promise.resolve(BackgroundConfiguration.setBackgroundRandomList(randomList)),
                    BackgroundConfiguration.refreshBackgroundImagePath(backgroundImageCodeArray)
                ]),
                codes
            );
        }).then(([_, codes]) => {
            refreshImageCodeList();
            // 发送数据
            backgroundSendMessage({
                name: 'deleteImageSuccess',
                value: codes
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
}

/** 清除背景图相关设置 */
export function clearBackgroundConfig () {
    showMessageByModal('是否清除背景图配置').then(() => {
        const nowCode = BackgroundConfiguration.getBackgroundNowImageCode;
        if (nowCode) {
            // 发送settingBackgroundSuccess数据通知webview侧关闭当前图片的选中样式
            backgroundSendMessage({
                name: 'settingBackgroundSuccess',
                value: nowCode
            });
        }
    }).then(() => {
        return Promise.resolve(
            clearBackgroundConfigExecute()
        );
    }).then(() => {
        if (BackgroundConfiguration.getBackgroundIsRandom) {
            // 如果当前设置了随机切换，需要关闭
            randomSettingBackground(false, false);
        }
    }).catch(err => {
        err && errlog(err);
    });
}

/** 执行配置清除方法 */
export function clearBackgroundConfigExecute () {
    return showProgress({
        location: 'Notification',
        title: '清除中'
    }, (progress) => <Promise<void>>new Promise(resolve => {
        deleteBackgroundCssFileModification().then(() => {
            progress.report({
                message: '清除成功',
                increment: 100
            });
            return delay(500);
        }).then(() => {
            isWindowReloadToLoadBackimage("背景图配置清除成功，是否重启窗口");
        }).catch(err => {
            return Promise.reject(err);
        }).finally(() => {
            resolve();
        });
    }));
}

/** 侧栏webview页面从本地文件选择背景图 */
export function selectImage () {
    const sendMsg: string[] = [];
    selectFile({
        many: true,
        files: true,
        filters: imageFilters,
        defaultUri: selectFileDefaultPath
    }).then(({ uri, dirName }) => {
        return <Promise<Uri[]>>new Promise((resolve, reject) => {
            // 选择一次文件后保存默认选择路径
            Promise.resolve(
                BackgroundConfiguration.setBackgroundSelectDefaultPath(selectFileDefaultPath = dirName)
            ).then(() => {
                resolve(uri);
            }).catch(err => {
                reject($rej(err, selectImage.name + ' > ' + selectFile.name));
            });
        });
    }).then(uris => {
        return Promise.all(
            uris.map(uri => imageToBase64(uri.fsPath))
        );
    }).then(base64s => {
        return addImageToStorage(base64s);
    }).then(codes => {
        sendMsg.push(...codes);
    }).catch(err => {
        errlog(err, true);
    }).finally(() => {
        backgroundSendMessage({
            name: 'newImage',
            value: sendMsg
        });
    });
}

/** 新增的哈希码储存至缓存和储存空间 */
export function addImageToStorage (imageDatas: string[]): Promise<string[]> {
    return new Promise((resolve, reject) => {
        /** 需要发送的数据 */
        const result: string[] = [];
        Promise.all(
            imageDatas.map(imageData => createFileStore(imageData))
        ).then(codes => {
            for (const index of range(-1, codes.length - 1)) {
                const code = codes[index];
                result.push(code);
                backgroundImageCodeArray.unshift(code);
            }
            return BackgroundConfiguration.refreshBackgroundImagePath(backgroundImageCodeArray);
        }).then(() => {
            refreshImageCodeList();
            resolve(result);
        }).catch(err => {
            reject($rej(err, addImageToStorage.name));
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
    success: boolean = false;
    /** 状态栏显示提示 */
    const statusBarTarget: Disposable = setStatusBarResolve({
        icon: 'loading~spin',
        message: '侧栏列表初始化中'
    });
    refreshImageCodeList();
    // 重置repositoryData数据
    repositoryData.clear();
    // 判断压缩文件夹
    createCompressDirectory().then(() => {
        // 检索数据
        return selectAllImage();
    }).then(({ files, uri }) => {
        return checkImageFile(files, uri);
    }).then(buffers => {
        return changeToString(buffers);
    }).then(codes => {
        return refreshBackgroundImageList(codes);
    }).then(codes => {
        backgroundSendMessage({
            name: 'backgroundInitData',
            value: codes
        });
        success = true, length = codes.length;
        return BackgroundConfiguration.refreshBackgroundImagePath(codes);
    }).then(() => {
        refreshImageCodeList();
        // 通过缓存获取图片哈希码发送
        const state = BackgroundConfiguration.getBackgroundIsSetBackground;
        if (state) {
            backgroundSendMessage({
                name: 'settingBackgroundSuccess',
                value: BackgroundConfiguration.getBackgroundNowImageCode
            });
        }
    }).then(() => {
        // 发送当前透明度
        backgroundSendMessage({
            name: 'nowBackgroundOpacity',
            value: BackgroundConfiguration.getBackgroundOpacity
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
            value: BackgroundConfiguration.getBackgroundIsRandom ? 
                BackgroundConfiguration.getBackgroundRandomList : 
                false
        });
        statusBarTarget?.dispose();
        // 延迟指定时间后修改状态栏信息，仅当图片数量大于0时显示
        if (length > 0) {
            setBackgroundImageSuccess('侧栏列表初始化成功');
        }
        isBackgroundCheckComplete.running = false;
        executeInitFunc();
    });
}

/**
 * 根据传入的哈希码发送对应图片base64数据
 * @param options 需要获取数据的哈希码以及传递的类型，用于webview侧判断哪边调用 
 */
export function getBase64DataByCode ({ code, type, thumbnail = false }: { code: string, type: string, thumbnail: boolean }): void {
    if (repositoryData.has(code)) {
        backgroundSendMessage({
            name: 'backgroundSendBase64Data',
            value: {
                code, 
                data: getRepositoryDataByCode(code, thumbnail), 
                type
            }
        });
    }
}

/**
 * 从储存对象中根据哈希码获取base64数据
 * @param code 图片哈希码
 * @param thumbnail 是否需要缩略图数据
 */
export function getBase64DataFromObject (code: string, thumbnail: boolean = false): string {
    return getRepositoryDataByCode(code, thumbnail);
}

/**
 * 将从储存路径下读取的图片base64数据和对应哈希码一起返回
 * @param buffers 
 */
function changeToString (buffers: bufferAndCode[]): Promise<string[]> {
    return new Promise((resolve, reject) => {
        imageStoreUri().then(uri => {
            // 校验当前哈希码是否存在于缓存列表中以及获取缩略图
            return Promise.all(buffers.map(({ code, buffer }) => {
                return codeListRefresh(code, 'check', { addData: buffer.toString(), uri });
            }));
        }).then(codes => {
            // 判断哪些数据不存在，不存在则插入缓存
            for (const index of range(-1, codes.length - 1)) {
                const { exist, code } = codes[index];
                if (!exist) {
                    backgroundImageCodeArray.unshift(code);
                }
            }
            return codes.map(item => item.code);
        }).then(codes => {
            resolve(codes);
        }).catch(err => {
            reject($rej(err, changeToString.name));
        });
    });
}

/** 缓存哈希码新增操作 */
function codeAdd (code: string, originData: string, thumbnailData: string): Promise<string> {
    // 储存Map添加一条数据
    repositoryData.set(code, {
        origin: originData??'',
        thumbnail: thumbnailData??''
    });
    return Promise.resolve(code);
}

/** 缓存哈希码删除操作 */
function codeDelete (code: string): Promise<string> {
    // 删除存储对象中的base64数据
    if (repositoryData.has(code)) {
        repositoryData.delete(code);
    }
    return Promise.resolve(code);
}

/** 缓存哈希码检查操作 */
function codeCheck (code: string, data: string, uri: Uri): Promise<{ code: string; exist: boolean; }> {
    return new Promise((resolve, reject) => {
        getCompressImage(code, data, uri).then(({ data: $data }) => {
            let exist = true;
            if (backgroundImageCodeArray.indexOf(code) < 0) {
                // 缓存数组中不存在，需要添加
                exist = false;
            }
            return createExParamPromise(codeAdd(code, data, $data), exist);
        }).then(([$code, exist]) => {
            resolve({ code: $code, exist });
        }).catch(err => {
            reject($rej(err, codeCheck.name));
        });
    });
}

/**
 * 对哈希码数据缓存数组进行更新操作
 * @param code 
 * @param state 
 */
function codeListRefresh(code: string, state: 'check', options: CodeRefreshType): Promise<{ code: string; exist: boolean; }>;
function codeListRefresh(code: string, state: 'add' | 'delete', options: CodeRefreshType): Promise<string>;
function codeListRefresh (
    code: string, 
    state: codeChangeType,
    { addData = void 0, compressData = void 0, uri = void 0 }: CodeRefreshType
): Promise<string | { code: string, exist: boolean }> {
    if (state === 'add') {
        return codeAdd(code, addData!, compressData!);
    } else if (state === 'delete') {
        return codeDelete(code);
    } else if (state === 'check') {
        return codeCheck(code, addData!, uri!);
    } else {
        return Promise.resolve(code);
    }
}

/**
 * 判断列表中是否含有此图片哈希码
 * @param code 
 */
function hasHashCode (code: string): boolean {
    return backgroundImageCodeArray.includes(code);
}

/**
 * 比较缓存数据和新数据是长度否相同，不相同则表明储存路径下可能有文件被删除，需要更新缓存数组。
 * 在上一步操作中，对从目录下获取的数据进行map处理时有完成校验，
 * 如果路径下有新数据是缓存数组中没有的则会往数组内push一个新的哈希码。
 * 所以如果此时两个数组长度不同，则一定是缓存数组长于新数组，有数据被删除。
 * 但在此方法中，对缓存数组长度大于和小于新数组长度都进行处理
 */
function refreshBackgroundImageList (codes: string[]): Promise<string[]> {
    return new Promise((resolve, reject) => {
        const cacheData: string[] | null = BackgroundConfiguration.getBackgroundAllImageCodes;
        if (codes.length === cacheData.length) {
            return resolve(codes);
        }
        Promise.resolve().then(() => {
            // 新数组长度等于缓存数组长度，直接返回
            if (codes.length > cacheData!.length) {
                // 比缓存数组长则需要添加数据（一般不会出现）
                return compareCodeList(codes, cacheData!, 'add');
            } else if (codes.length < cacheData!.length) {
                // 短则需要删除数据
                return compareCodeList(cacheData!, codes, 'delete');
            } else {
                return Promise.resolve();
            }
        }).then(() => {
            resolve(codes);
        }).catch(err => {
            reject($rej(err, refreshBackgroundImageList.name));
        });
    });
}

/**
 * 新旧数组进行比较，因为是比较哈希码，不存在数组元素重复的问题
 * @param long 长一点的数组，用于校验
 * @param short 短一点的数组
 */
async function compareCodeList (long: string[], short: string[], type: 'add' | 'delete' = 'add'): Promise<void> {
    for (const item of long) {
        const index = short.findIndex(i => i === item);
        // 直接使用字符串进行操作，因为删除一个数据后再传索引对应的数据会不正确
        if (index < 0) {
            await BackgroundConfiguration.setBackgroundAllImageCodes(item, type).catch(err => {
                return Promise.reject($rej(err, compareCodeList.name));
            });
        }
    }
    return Promise.resolve();
}

/**
 * 校验储存图片base64数据的文件并进行读取
 * @param files 指定目录下的所有文件列表
 * @param uri 
 */
function checkImageFile (files: [string, FileType][], uri: Uri): Promise<bufferAndCode[]> {
    return new Promise((resolve, reject) => {
        Promise.resolve().then(() => {
            /** 异步处理数组 */
            const fileRequest: Array<Promise<{ buffer: Uint8Array, code: string }>> = [],
            /** 匹配文件正则 */
            searchRegexp = /(.*?).back.wyg$/,
            /** 辅助检测数组 */
            checkArray: number[] = [];
            for (const i of range(files.length)) {
                const file = files[i][0];
                // 对满足要求的文件进行文件数据读取
                const reg = file.match(searchRegexp);
                if (!reg) {
                    continue;
                }
                const index = backgroundImageCodeArray.indexOf(reg[1]);
                // 需要加一个index为-1的判断，防止递归死循环
                const posi = index >= 0 ? bisectionAsce(checkArray, index) : 0;
                checkArray.splice(posi, 0, index);
                fileRequest.splice(posi, 0, getFileAndCode(newUri(uri, file), reg[1]));
            }
            return Promise.all(fileRequest);
        }).then(res => {
            resolve(res);
        }).catch(err => {
            reject($rej(err, checkImageFile.name));
        });
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
            reject($rej(err, getFileAndCode.name));
        });
    });
}

/** 获取背景图目录下的所有文件，并校验路径下的文件夹是否存在 */
function selectAllImage (): Promise<{ files: [string, FileType][], uri: Uri }> {
    return new Promise((resolve, reject) => {
        imageStoreUri().then(uri => {
            return createExParamPromise(readDirectoryUri(uri), uri);
        }).then(([res, uri]) => {
            resolve({ files: res, uri });
        }).catch(err => {
            reject($rej(err, selectAllImage.name));
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
        imageStoreUri().then(uri => {
            const code: string = newHashCode();
            // 原文件写入
            return createExParamPromise(writeFileUri(newUri(uri, `${code}.back.wyg`), createBuffer(base64)), uri, code);
        }).then(([_, uri, $code]) => {
            // 写入压缩图
            return getCompressImage($code, base64, uri);
        }).then(({ code: $code, data }) => {
            // 新增一个哈希码数据
            return codeListRefresh($code, 'add', { addData: base64.toString(), compressData: data });
        }).then($code => {
            resolve($code);
        }).catch(err => {
            reject($rej(err, createFileStore.name));
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
            return reject(new WError('Undefined Hash Code', {
                position: 'Parameter',
                FunctionName: deleteFileStore.name,
                ParameterName: 'code',
                description: 'The hash code to delete image is undefined'
            }));
        }
        imageStoreUri().then(uri => {
            // 原图删除
            return uriDelete(newUri(uri, `${code}.back.wyg`));
        }).then(() => {
            // 删除压缩图
            return deleteCompressByCode(code);
        }).then(() => {
            return codeListRefresh(code, 'delete', {});
        }).then($code => {
            resolve($code);
        }).catch(err => {
            reject($rej(err, deleteFileStore.name));
        });
    });
}