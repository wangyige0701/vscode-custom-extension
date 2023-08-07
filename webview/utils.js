/* index(0) */

/* 公共js工具 */

/**
 * 
 * @param {string} type 
 * @returns {boolean}
 */
function checkMediaType (type) {
    const typeList = ['application', 'audio', 'font', 'example', 'image', 'message', 'model', 'multipart', 'text', 'video'];
    for (let index in typeList) {
        if (type.startsWith(typeList[index])) return true;
    }
    return false;
}

/**
 * 数据转换为blob的路径字符串
 * @param {any|any[]} data
 * @param {string} type
 * @returns {string}
*/
function dataToBlob (data, type) {
    try {
        if (!checkMediaType(type)) throw new Error('Illegal type');
        return URL.createObjectURL(
            new Blob(isArray(data)?data:[data], { type })
        );
    } catch (error) {
        throw new Error(error);
    }
}

/**
 * 释放创建的URL对象
 * @param {string} data 
 */
function revokeBlobData (data) {
    try {
        if (data) URL.revokeObjectURL(data);
    } catch (error) {
        throw new Error(error);
    }
}

/**
 * 获取base64数据的类型
 * @param {string} data
 */
function getBase64Type (data) {
    return data.match(/^data:(\w+)\/(\w+);base64,(.*?)$/);
}

/**
 * 将base64数据转为blob路径数据
 * @param {string} data 
 * @returns {string}
 */
function base64ToBlob (data) {
    const result = getBase64Type(data);
    const [n, dataName, fileName, fileData] = result;
    const butr = window.atob(fileData);
    let length = butr.length;
    const unit8 = new Uint8Array(length);
    while (length--) {
        unit8[length] = butr.charCodeAt(length);
    }
    return dataToBlob(unit8, `${dataName}/${fileName}`);
}

/**
 * 防抖函数
 * @param {Function} callback 
 * @param {any} param 
 * @returns 
 */
function debounce (callback, time, param) {
    let timeout;
    return function (...params) {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(callback.bind(null, ...[param, ...params]), time);
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
 * @param {string[]|string} options 需要获取的属性名数组
 * @param {boolean} list 是否返回数组格式
 * @returns {string[] | {[key: string]: string}}
 */
function complexGetAttr (target, options, list = true) {
    if (!isArray(options)) options = isString(options) ? [options] : [];
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
 * @param {{[key: string]: string|string[]}|string} options
 * @param {'css'|'cssProperty'|'text'|'html'} type css: 设置css属性; cssProperty：设置css变量；text：设置文本；html：innerHTML
 * @returns {HTMLElement}
 */
function complexSetAttr (target, options, type) {
    if (!target || !target instanceof HTMLElement) return;
    if (isString(options)) {
        if (type === 'text') {
            // 设置文本
            target.innerText = options;
            return target;
        } else if (type === 'html') {
            target.innerHTML = options;
            return target;
        }
    }
    if (!isObject(options)) return target;
    for (let key in options) {
        if (!key) continue;
        let value = options[key];
        // 如果属性有style，走css属性
        if (key === 'style' && isObject(value)) {
            complexSetAttr(target, value, 'css');
            continue;
        }
        if (isArray(value)) value = value.reduce((pre, curr, currIndex) => {
            return pre + (isString(curr) ? `${currIndex>0&&curr?' ':''}${curr}` : '');
        }, '');
        // 数据类型改为字符串
        value = String(value);
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
 * @param {Element|ShadowRoot} target dom节点或者阴影根节点
 * @param {Element[]|Element} childs 需要插入的子节点
 * @returns {Element}
 */
function complexAppendChild (target, childs) {
    if (!target || !target instanceof Element || !target instanceof ShadowRoot) return;
    if (!Array.isArray(childs)) {
        if (childs && childs instanceof Element) {
            childs = [childs];
        } else {
            return target
        }
    };
    for (let i = 0; i < childs.length; i++) {
        let dom = childs[i];
        if (!dom || !dom instanceof Element) continue;
        target.appendChild(dom);
    }
    return target;
}

/**
 * 选择元素节点
 * @param {string} target
 * @param {boolean|Element|{ all: boolean, element: Element }} options 传入boolean时，为是否获取所有元素；
 * 为对象时，通过all属性设置获取所有元素，通过element属性设置检索对象
 * @returns {Element|Element[]|null}
 */
function $query (target, options = false) {
    if (!isString(target)) return null;
    target = target.trim();
    let all = false;
    /** @type {Element} */
    let element = document;
    if (options instanceof Element) {
        element = options;
    } else if (isBoolean(options)) {
        all = options;
    } else if (isObject(options)) {
        // 是否全选
        all = options?.all??false;
        // 检索对象
        element = options?.element??document;
    }
    if (/^[^\s>~,\:]+[\s>~,\:\.#]+/.test(target)) {
        return all ? changeToArray(element.querySelectorAll(target)) : element.querySelector(target);
    } else if (target.startsWith('.')) {
        // 类名选择器
        return all ? changeToArray(element.getElementsByClassName(target.slice(1))) : element.querySelector(target);
    } else if (target.startsWith('#')) {
        // 类名选择器
        return document.getElementById(target.slice(1));
    } else {
        // 标签选择器
        return all ? changeToArray(element.getElementsByTagName(target)) : element.querySelector(target);
    }
}

/**
 * 将元素对象转换为数组
 * @typedef {Element} theElement
 * @param {HTMLCollectionOf<theElement>|NodeListOf<theElement>|null} item 
 * @returns {theElement[]}
 */
function changeToArray (item) {
    if (!item) return item;
    const result = [];
    for (let i = 0; i < item.length; i++) {
        result.push(item[i]);
    }
    return result;
}

/**
 * 是否是字符串
 * @param {any} target 
 */
function isString (target) {
    return typeof target === 'string';
}

/**
 * 是否是数组
 * @param {any} target 
 */
function isArray (target) {
    return Array.isArray(target);
}

/**
 * 是否是对象
 * @param {any} target 
 */
function isObject (target) {
    return toString.call(target) === '[object Object]';
}

/**
 * 是否是布朗类型
 * @param {any} target 
 */
function isBoolean (target) {
    return typeof target === 'boolean';
}

/**
 * 是否是数字
 * @param {any} target 
 */
function isNumber (target) {
    return typeof target === 'number';
}

/**
 * 是否是null
 * @param {any} target 
 */
function isNull (target) {
    return target === null;
}