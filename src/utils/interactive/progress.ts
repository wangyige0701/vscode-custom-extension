import { ProgressLocation, window } from "vscode";
import type { ProgressOptions } from "vscode";
import { isString } from '../index';
import type { ProgressLocationData, ProgressOptionsNew, ProgressTaskType } from './types';

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