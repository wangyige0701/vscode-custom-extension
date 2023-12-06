/** @fileoverview webview加载时图片数据监测模块 */

import type { Disposable } from "vscode";
import { isBackgroundCheckComplete as status } from "../data";
import { setStatusBarResolve } from "../../../../common/interactive";
import { getHashCodesFromWorkspaceAndCache, imageFileDataAndHashCodeCache, refreshBackgroundImageList, imageDataRepository } from "../../app-background-cache";
import { isCompressDirectoryExist } from "../../app-background-files";
import { getAllImageFilesData, checkImageFiles } from "../../app-background-image";
import { sendInitializeDatas, sendSettingImageCode, sendSettingOpacity, sendRandomListInfo } from "../../app-background-webview";
import { refreshImagesPath } from "../../app-background-workspace";
import { errlog } from "../../../../error";
import { setBackgroundImageSuccess } from "../../app-background-common";

/**
 * webview首次加载或者重置储存路径时获取储存背景图片数据，获取当前设置的背景图哈希码并将其发送给webview页面；
 * 每次调用会重置缓存对象，从对应路径获取图片数据并依次更新缓存
 */
export function backgroundImageDataInit () {
    // 正则执行背景图校验或者正在执行初始化函数，则修改状态，等待完成后再次执行
    if (status.check || status.running) {
        status.onInit();
        return;
    }
    // 开始执行
    status.onRunning();
    // 关闭需要初始化状态
    status.offInit();
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
    })
    .then(({ files, uri }) => {
        return checkImageFiles(files, uri);
    })
    .then(datas => {
        return imageFileDataAndHashCodeCache(datas);
    })
    .then(codes => {
        return refreshBackgroundImageList(codes);
    })
    .then(codes => {
        sendInitializeDatas(codes);
        success = true;
        length = codes.length;
        return refreshImagesPath(codes);
    })
    .then(() => {
        getHashCodesFromWorkspaceAndCache();
        sendSettingImageCode();
        sendSettingOpacity();
    })
    .catch(err => {
        errlog(err);
        if (!success) {
            // 出错判断初始化数据有没有发送
            sendInitializeDatas([]);
        }
    })
    .finally(() => {
        // 获取当前随机设置背景图的状态，发送响应消息
        sendRandomListInfo();
        statusBarTarget?.dispose();
        // 延迟指定时间后修改状态栏信息，仅当图片数量大于0时显示
        if (length > 0) {
            setBackgroundImageSuccess('侧栏列表初始化成功');
        }
        status.offRunning();
        if (status.init) {
            backgroundImageDataInit();
        }
    });
}