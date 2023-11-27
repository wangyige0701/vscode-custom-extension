import { isFunction, isPromise } from "../main";

/**
 * 创建一个队列执行对象
 */
export function queueCreate (immediately: boolean = true) {
    let executeing: boolean = false;
    const queue: Array<Function|Promise<any>> = [];
    /** 插入队列 */
    function set (func: Function|Promise<any>) {
        if (!func || (!isFunction(func) && !isPromise(func))) {
            return;
        }
        queue.push(func);
        if (immediately && !executeing) {
            execute();
        }
    }
    /** 执行队列 */
    function execute () {
        if (queue.length <= 0) {
            executeing = false;
            return;
        }
        executeing = true;
        const executeTarget = queue.shift();
        Promise.resolve(
            isFunction(executeTarget) ? executeTarget() : executeTarget
        ).then(() => {
            if (queue.length === 0) {
                executeing = false;
            } else {
                immediately && execute();
            }
        }).catch(err => {
            executeing = false;
            throw new Error(err);
        });
    }
    function clear () {
        executeing = false;
        queue.splice(0);
    }
    return {
        set,
        execute,
        clear
    };
}