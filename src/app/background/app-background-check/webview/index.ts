/** @fileoverview webview加载时图片数据监测模块 */

import type { Disposable } from "vscode";
import { isBackgroundCheckComplete } from "../data";
import { setStatusBarResolve } from "../../../../common/interactive";
import { getHashCodesFromWorkspaceAndCache } from "../../app-background-cache";
import { imageDataRepository } from "../../app-background-cache";
import { isCompressDirectoryExist } from "../../app-background-files";
import { getAllImageFilesData } from "../../app-background-image";

/**
 * webview首次加载或者重置储存路径时获取储存背景图片数据，获取当前设置的背景图哈希码并将其发送给webview页面；
 * 每次调用会重置缓存对象，从对应路径获取图片数据并依次更新缓存
 */
export function backgroundImageDataInit () {
    // 正则执行背景图校验或者正在执行初始化函数，则修改状态，等待完成后再次执行
    if (isBackgroundCheckComplete.check || isBackgroundCheckComplete.running) {
        isBackgroundCheckComplete.onInit();
        return;
    }
    // 开始执行
    isBackgroundCheckComplete.onRunning();
    // 关闭需要初始化状态
    isBackgroundCheckComplete.offInit();
    let length: number = 0;
    let success: boolean = false;
    /** 状态栏显示提示 */
    const statusBarTarget: Disposable = setStatusBarResolve({
        icon: 'loading~spin',
        message: '侧栏列表初始化中'
    });
    getHashCodesFromWorkspaceAndCache();
    // 重置图片数据缓存
    imageDataRepository.clear();
    // 判断压缩文件夹
    isCompressDirectoryExist()
    .then(() => {
        // 检索数据
        return getAllImageFilesData();
    }).then(({ files, uri }) => {
        return checkImageFiles(files, uri);
    }).then(buffers => {
        return imageFileDataAndHashCodeCache(buffers);
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
        getHashCodesFromWorkspaceAndCache();
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
        isBackgroundCheckComplete.offRunning();
        executeInitFunc();
    });
}