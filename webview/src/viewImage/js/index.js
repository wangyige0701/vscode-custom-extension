/* index(1) */

const imageContainerId = 'image';
/** 图片标签实例 @type {HTMLImageElement} */
var imageInstance = null,
    window_width = 0,
    window_heigth = 0,
    image_width = 0,
    image_height = 0,
    re_image_width = 0,
    re_image_height = 0;

const imageSetStack = [];

var size_debounce = debounce(window_size, true);

// 监听窗口尺寸改变
window.addEventListener('resize', size_debounce);

// 监听页面销毁
window.addEventListener('unload', destroyImage);

// 加载窗口时创建图片元素
window.addEventListener('load', createImage);

// 监听消息发送
window.addEventListener('message', receiveMessage);

function debounce (callback, param) {
    let timeout;
    return function () {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(callback.bind(null, param), 300);
    }
}

/** 接收extensions侧发送的消息 */
function receiveMessage ({ data }) {
    if (data.group !== 'viewImage') return;
    const value = data.value;
    switch (data.name) {
        case 'changeImage':
            // 设置图片路径
            setStack(value);
            break;
        case 'destroy':
            destroyImage();
            break;
        default:
            break;
    }
}

/** 刷新图片样式 */
async function changeImageStyle (src) {
    if (!imageInstance || !src) return;
    let target = document.getElementById(imageContainerId);
    if (target.childElementCount > 0) {
        target.removeChild(imageInstance);
    }
    target.style.cssText = '';
    target.classList.add('loading', 'iconfont');
    loadImage(src, function () {
        re_image_width = imageInstance.width;
        re_image_height = imageInstance.height;
        complete_size();
        target.classList.remove('loading', 'iconfont');
        target.append(imageInstance);
        // 修改图片位置
        image_position();
        return Promise.resolve();
    });
}

/** 计算图片显示尺寸 */
function complete_size () {
    let window_rate = decimal(window_width / window_heigth), 
        image_rate = decimal(re_image_width / re_image_height),
        max_width = decimal(window_width * 0.9),
        max_height = decimal(window_heigth * 0.9);
    if (image_rate > window_rate) {
        // 图片宽高比大于窗口，取最大宽度
        image_width = decimal(Math.min(max_width, re_image_width));
        image_height = decimal(image_width / image_rate);
    } else {
        // 取最大高度
        image_height = decimal(Math.min(max_height, re_image_height));
        image_width = decimal(image_height * image_rate);
    }
    // 宽高赋值
    imageInstance.style.cssText = `width: ${image_width}px; height: ${image_height}px;`;
}

/**
 * 加载图片数据
 * @param {string} src 图片路径
 * @param {(this: GlobalEventHandlers, e: Event) => void} callback
*/
function loadImage (src, callback) {
    imageInstance.onload = function (e) {
        callback?.call(this, e);
    }
    imageInstance.src = src;
}

/** 队栈内容执行 */
function executeStack () {
    if (!imageInstance || imageSetStack.length <= 0) return;
    changeImageStyle(imageSetStack.shift()).then(() => {
        executeStack();
    });
}

/** 队栈插入数据 */
function setStack (src) {
    imageSetStack.push(src);
    executeStack();
}

/** 创建新的image实例 */
function createImage () {
    window_size();
    if (!imageInstance) {
        imageInstance = new Image();
        executeStack();
    }
}

/** 销毁image实例 */
function destroyImage () {
    console.log(1);
    window.removeEventListener('resize', size_debounce);
    window.removeEventListener('load', createImage);
    window.removeEventListener('message', receiveMessage);
    size_debounce = null;
    imageInstance = null;
}

/** 窗口尺寸改变 */
function window_size (type = false) {
    window_width = document.body.clientWidth;
    window_heigth = document.body.clientHeight;
    if (type) {
        complete_size();
        image_position();
    }
}

/** 图片定位中间 */
function image_position () {
    if (!imageInstance || image_width <= 0 || image_height <= 0) return;
    let left = decimal((window_width - image_width) / 2), top = decimal((window_heigth - image_height) / 2);
    document.getElementById(imageContainerId).style.cssText = `left: ${left}px; top: ${top}px; width: ${image_width}px; heigth: ${image_height}px;`;
}

/** 保留指定小数 */
function decimal (number, t = 3) {
    return +number.toFixed(t);
}