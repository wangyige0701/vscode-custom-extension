/* index(2) */

/* 队列执行方法 */

class Queue {
    /** 存放队列执行函数的数组 @type {Function[]} */
    #queue = [];

    /** 队列函数是否正则执行 */
    #running = false;

    /** 是否在插入后立即执行，默认立即执行 */
    #immediately = false

    /** @param {boolean} immediately 是否在插入数据后立即执行队列函数 */
    constructor (immediately=true) {
        this.#immediately = immediately;
    }

    /**
     * @param {...Function} funcs 入队列等待执行的函数
     */
    set (...funcs) {
        if (funcs.length <= 0) return;
        for (const func of funcs) {
            if (!func || typeof func !== 'function') continue;
            this.#queue.push(func);
        }
        if (this.#running) return;
        if (this.#immediately) this.execute();
    }

    /** 
     * 执行函数
     * @param {boolean} immediately: 是否在当前函数执行完成后立即执行下一个函数
     * */
    execute (immediately=true) {
        if (this.#queue.length <= 0) {
            this.#end();
            return;
        }
        this.#start();
        Promise.resolve(
            this.#queue.shift()?.()
        ).then(() => {
            // 立即执行
            if (immediately) this.execute(immediately);
        }).catch(err => {
            throw new Error('Queue Execute Error', { cause: err });
        });
    }

    #end () {
        if (!this.#running) return;
        this.#running = false;
    }

    #start () {
        if (this.#running) return;
        this.#running = true;
    }
}