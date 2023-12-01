/** @fileoverview webview加载时图片数据监测模块 */

import { isBackgroundCheckComplete } from "./data";

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