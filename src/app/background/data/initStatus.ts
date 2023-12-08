/** @fileoverview webview列表允许初始化的状态判断数据类 */

import type { BackgroundCheckComplete } from "../@types";

class InitStatusHandle implements BackgroundCheckComplete {
    private _check: boolean;

    private _init: boolean;

    private _running: boolean;

    constructor () {
        this._check = false;
        this._init = false;
        this._running = false;
    }

    get check () {
        return this._check;
    }

    get init () {
        return this._init;
    }

    get running () {
        return this._running;
    }

    onCheck () {
        this._check = true;
    }

    offCheck () {
        this._check = false;
    }

    onInit () {
        this._init = true;
    }

    offInit () {
        this._init = false;
    }

    onRunning () {
        this._running = true;
    }

    offRunning () {
        this._running = false;
    }
};

/** 背景图是否校验完成判断，完成后才能进行列表初始化 */
export const initStatusHandle = new InitStatusHandle();