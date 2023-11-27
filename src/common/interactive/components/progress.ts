import type { ProgressOptions } from "vscode";
import type { ProgressLocationData, ProgressOptionsNew, ProgressTaskType } from '../types';
import { ProgressLocation, window } from "vscode";
import { isString } from '../../../utils';

/**
 * 调用进度条api
 * @param options 
 * @param task 
 */
export function showProgress<R> (options: ProgressOptionsNew, task: ProgressTaskType<R>): Thenable<R> {
    if (isString(options.location)) {
        options.location = getProgressLocation(options.location as ProgressLocationData);
    }
    return window.withProgress(options as ProgressOptions, task);
}

/**
 * 获取location的值
 * @param name 
 */
function getProgressLocation (name: ProgressLocationData) {
    return ProgressLocation[name];
}

/**
 * 在指定时间内显示提示信息
 */
export function showProgressByTime (content: string, time: number, showTime: boolean = true) {
    showProgress({
        title: content,
        location: 'Notification',
        cancellable: false
    }, (progress) => <Promise<void>>new Promise(resolve => {
        progress.report({
            increment: 100
        });
        if (!showTime) {
            setTimeout(resolve, time);
            return;
        }
        /** 轮询函数 */
        function _polling (time: number, callback: (s: string) => void) {
            return <Promise<void>>new Promise(resolve => {
                function _run (t: number) {
                    if (t < 1000) {
                        setTimeout(() => {
                            callback('');
                            resolve();
                        }, 1000 - t);
                        return;
                    }
                    callback(`（${Math.floor(t / 1000)}秒后关闭）`);
                    setTimeout(() => {
                        _run(t - 1000);
                    }, 1000);
                }
                _run(time);
            });
        }
        _polling(time, (s) => {
            progress.report({
                message: s
            });
        }).then(resolve);
    }));
}