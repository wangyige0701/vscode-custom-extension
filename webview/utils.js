/* index(0) */

/* 公共js工具 */

/**
 * 数据转换为blob
*/
function dataToBlob (data, type) {}

/**
 * 防抖函数
 * @param {Function} callback 
 * @param {any} param 
 * @returns 
 */
function debounce (callback, param) {
    let timeout;
    return function () {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(callback.bind(null, param), 300);
    }
}

/**
 * 创建元素
 * @param {string} name
*/
function $create (name) {
    return document.createElement(name);
}

/**
 * 获取节点复数属性
 * @param {HTMLElement} target 目标元素
 * @param {string[]} options 需要获取的属性名数组
 * @param {boolean} list 是否返回数组格式
 * @returns {string[] | {[key: string]: string}}
 */
function complexGetAttr (target, options, list = true) {
    if (!Array.isArray(options)) options = [];
    if (!target || !target instanceof HTMLElement) return list ? new Array(options.length).fill(undefined) : options.reduce((obj, value) => {
        obj[value] = undefined;
        return obj;
    }, {});
    /** @type {string[]|{[key: string]: string}} */
    let result = list ? [] : {};
    options.forEach(key => {
        // 除了通过getAttribute获取，还有可能是set、get获取
        let value = target.hasAttribute(key) ? target.getAttribute(key) : (target[key] ?? undefined);
        list ? result.push(value) : result[key] = value;
    });
    return result;
}

/**
 * 设置复数节点属性
 * @param {HTMLElement} target 
 * @param {{[key: string]: string}|string} options
 * @param {'css'|'cssProperty'|'text'} type css: 设置css属性; cssProperty：设置css变量；text：设置文本
 * @returns {HTMLElement}
 */
function complexSetAttr (target, options, type) {
    if (!target || !target instanceof HTMLElement) return;
    if (type === 'text' && typeof options === 'string') {
        // 设置文本
        target.innerText = options;
        return target;
    }
    if (!toString.call(options) === '[object Object]') return target;
    for (let key in options) {
        if (!key) continue;
        let value = options[key];
        if (type === 'css') {
            // 设置css样式
            target.style.hasOwnProperty(key) ? target.style[key] = value : null;
            continue;
        }
        if (type === 'cssProperty') {
            // 设置css变量
            target.style.setProperty(key, value);
            continue;
        }
        target.setAttribute(key, value);
    }
    return target;
}

/**
 * 将复数节点插入根节点
 * @param {HTMLElement|ShadowRoot} target dom节点或者阴影根节点
 * @param {HTMLElement[]} list 
 * @returns {HTMLElement}
 */
function complexAppendChild (target, list) {
    if (!target || !target instanceof HTMLElement || !target instanceof ShadowRoot) return;
    if (!Array.isArray(list)) {
        if (list && list instanceof HTMLElement) {
            list = [list];
        } else {
            return target
        }
    };
    for (let i = 0; i < list.length; i++) {
        let dom = list[i];
        if (!dom || !dom instanceof HTMLElement) continue;
        target.appendChild(dom);
    }
    return target;
}