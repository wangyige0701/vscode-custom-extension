/** @fileoverview webview列表允许初始化的条件判断 */

import type { BackCheckComplete } from "../@types";

/** 背景图是否校验完成判断，完成后才能进行列表初始化 */
export const isBackgroundCheckComplete: BackCheckComplete = {
    check: false,
    init: false,
    running: false,
    onCheck () {
        this.check = true;
    },
    offCheck () {
        this.check = false;
    },
    onInit () {
        this.init = true;
    },
    offInit () {
        this.init = false;
    },
    onRunning () {
        this.running = true;
    },
    offRunning () {
        this.running = false;
    }
};