import { Webview } from "vscode";
import type { 
    ExecuteFunction, 
    ExecuteType, 
    GetName, 
    MessageData, 
    MessageExecuteType, 
    MessageGroupCallback, 
    MessageGroupCallbackName, 
    callbackType
} from "./types";
import { errlog } from "../../error";
import { firstUpperCase, isUndefined } from "..";

/** 绑定通信回调函数对象 */
const messageCallback: MessageGroupCallback = {
    onBackground: null,
    onViewImage: null
};

/** 绑定webview侧通信数据接收回调函数 */
export function bindMessageCallback (name: MessageGroupCallbackName, callback: callbackType) {
    if (callback && name in messageCallback) {
        messageCallback[name] = callback;
    }
}

/** 解除webview侧通信数据接收回调函数 */
export function unbindMessageCallback (name: MessageGroupCallbackName) {
    if (name in messageCallback) {
        messageCallback[name] = null;
    }
}

/** webview侧通信事件接收统一处理 */
export function messageHandle (webview: Webview) {
    webview.onDidReceiveMessage((message: MessageData) => {
        const groupName = message.group;
        if (!groupName) {
            return;
        }
        /** 执行函数名 */
        const executeName = 'on' + firstUpperCase(groupName) as MessageGroupCallbackName;
        // 是否有对应函数
        if (!(executeName in messageCallback)) {
            return;
        }
        messageCallback[executeName]?.({
            name: message.name, 
            value: message.value
        }, webview);
    });
}

/** 扩展侧向webview侧发送通信数据 */
export function messageSend (webview: Webview, options: MessageData): void {
    if (webview) {
        try {
            webview.postMessage(options);
        } catch (error) {
            errlog(error);
        }
    }
}

/**
 * 根据配置信息执行接收到通讯信息后应该执行的函数
 */
export function messageExecute<T extends MessageDataType> (config: MessageExecuteType<T>) {
    if (!config.queue) {
        config.queue = (...funcs: Function[]) => {
            funcs.forEach(func => {
                func?.();
            });
        };
    }
    // 配置信息整理
    for (let t in config) {
        const target = config[t as GetName<T>];
        if (!Array.isArray(target.execute)) {
            target.execute = [target.execute];
        }
    }
    return <K extends GetName<T>, F = Extract<T, { name: GetName<T> }>["value"]>(name: string, value: any = void 0) => {
        if (!name || !(name in config)) {
            return;
        }
        /** 获取执行函数和是否队列执行判断 */
        const { execute, extra, queue = false } = config[name as K] as ExecuteType<F> & { execute: Array<ExecuteFunction<F>> };
        // 额外函数执行
        extra?.();
        for (const target of execute) {
            const { func, data = false, noneParam = false, param = void 0 } = target;
            if (!func || typeof func !== 'function') {
                continue;
            }
            // 是否需要传参并且参数有值
            if (data && isUndefined(value) && isUndefined(param)) {
                continue;
            }
            const executeFunction = isUndefined(param) // 当局部传参有数据时默认传局部参数
            ? (!isUndefined(value) && !noneParam) // 全局传参是否有数据并且需要参数
                ? (func as (value: any) => void).bind(null, value) 
                : (func as () => void).bind(null) 
            : (func as (value: any) => void).bind(null, param);
            // 判断是否队列执行
            queue ? config.queue!(executeFunction) : executeFunction();
        }
    };
}