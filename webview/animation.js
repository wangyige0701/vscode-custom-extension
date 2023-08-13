/* index(1) */


/**
 * 页面滚动至指定元素处
 * @typedef {'start'|'center'|'end'|'nearest'} dircetion
 * @param {Element} target 
 * @param {{behavior:'auto'|'smooth',block:dircetion,inline:dircetion}} options 
 * @param options.behavior 过渡效果
 * @param options.block 垂直方向的对齐
 * @param options.inline 水平方向的对齐
 */
function elementScrollIntoView (target, options) {
    if (!target || !(target instanceof Element)) return;
    const block = options?.block??'start',
    inline = options?.inline??'nearest',
    behavior = options?.behavior??'auto';
    target.scrollIntoView({
        behavior,
        block,
        inline
    });
}

/**
 * 
 * @param {Element} target 滚动的元素容器
 * @param {{top:number,left:number,behavior:'smooth'|'auto'|'instant'}} options 
 */
function elementScrollTo (target, options) {
    if (!target || !(target instanceof Element)) return;
    const top = options?.top??0,
    left = options.left??0,
    behavior = options?.behavior??'auto';
    target.scrollTo({
        top,
        left,
        behavior
    });
}

/**
 * 下一帧重绘前调用判断函数，结果为true则调用执行函数
 * @param {() => boolean} handleCallback 是否执行运行函数的条件判断函数，一定会返回一个布朗值
 * @param {(...params: any[]) => any} runCallback 判断条件为true时调用的函数
 * @param {number} stopTimestamp 调用的时间，超出则停止调用，单位为毫秒，默认十秒
 */
function animationFrameResult (handleCallback, runCallback, stopTimestamp = 10*1000) {
    if (!handleCallback || !runCallback || typeof handleCallback !== 'function' || typeof runCallback !== 'function') return;
    let start;
    function _step (timestamp) {
        start = timestamp;
        const result = handleCallback();
        if (typeof result !== 'boolean' || (timestamp - start) >= stopTimestamp) return;
        if (result === true) {
            // 为true则执行调用函数
            runCallback();
            return;
        }
        window.requestAnimationFrame(_step);
    }
    window.requestAnimationFrame(_step);
}