/* index(1) */

const vscode = acquireVsCodeApi();

const imageContainerId = 'image';
/** 图片标签实例 @type {HTMLImageElement} */
var imageInstance = null,
    window_width = 0,
    window_heigth = 0,
    image_width = 0,
    image_height = 0,
    re_image_width = 0,
    re_image_height = 0;

/** @type {string[]} 存放图片路径 */
const imageSetStack = [];

/** @type {string[]} 存放需要释放的blob路径 */
const revokeStack = [];

/** 图片操作属性 */
const operationTarge = {
    /** 是否可以对图片开始操作 */
    can: false,
    /** 实际缩放属性值 */
    scale: 1,
    /** 滚轮缩放因子 */
    scaleFactor: 0.1,
    /** 最大缩放 */
    maxScale: 3,
    /** 最小缩放 */
    minScale: 0.5,
    left: 0,
    minLeft: 0,
    maxLeft: 0,
    top: 0,
    minTop: 0,
    maxTop: 0,
    /** 位移极限的最大比率 */
    translateRate: 0.3
}

Object.defineProperty(operationTarge, 'scale', {
    set (newValue) {
        // 缩放时防止超出边界
        this.value = newValue;
        let rate = (newValue - 1) / 2,
           change = true;
        if (this.top < (this.minTop - (rate * image_height))) {
            this.top = this.minTop - (rate * image_height);
        } else if (this.top > (this.maxTop + (rate * image_height))) {
            this.top = this.maxTop + (rate * image_height);
        } else {
            change = false;
        }
        if (this.left < (this.minLeft - (rate * image_width))) {
            this.left = this.minLeft - (rate * image_width);
        } else if (this.left > (this.maxLeft + (rate * image_width))) {
            this.left = this.maxLeft + (rate * image_width);
        } else {
            change = false;
        }
        if (!change) return;
        changeCss(document.getElementById(imageContainerId));
    },
    get () {
        return this.value;
    }
});

var size_debounce = debounce(window_size, 300, true);

// 监听窗口尺寸改变
window.addEventListener('resize', size_debounce);

// 监听页面销毁
window.addEventListener('unload', destroyImage);

// 加载窗口时创建图片元素
window.addEventListener('load', createImage);

// 监听消息发送
window.addEventListener('message', receiveMessage);

// 双击复原图片
document.body.addEventListener('dblclick', image_transform_reset);

/** 接收消息通讯并执行对应函数的实例对象 @type {(name: string, value: any) => any} */
const messageReceiver = messageDataExecute({
    /** 设置图片路径 */
    changeImage: {
        execute: {
            func: setStack,
            data: true
        }
    },
    /** 图片销毁 */
    destroy: {
        execute: {
            func: destroyImage
        }
    }
});

/** 接收extensions侧发送的消息 */
function receiveMessage ({ data }) {
    if (data.group !== 'viewImage') return;
    // 执行通讯传递数据
    messageReceiver(data.name, data.value);
}

/** 
 * 刷新图片样式
 * @param {string} src
 *  */
async function changeImageStyle (src) {
    operationTarge.can = false;
    if (!imageInstance || !src) return;
    revokeStack.push(src);
    /** @type {HTMLElement} */
    let target = $query('#'+imageContainerId);
    if (target.childElementCount > 0) {
        target.removeChild(imageInstance);
    }
    target.style.cssText = '';
    loadImage(src, function () {
        re_image_width = imageInstance.width;
        re_image_height = imageInstance.height;
        complete_size();
        changeAnimation(false);
        target.append(imageInstance);
        // 修改图片位置
        image_position();
        operationTarge.can = true;
        return Promise.resolve();
    });
}

/**
 * 切换动画
 * @param {boolean} state 
 */
function changeAnimation (state = true) {
    if (state) {
        $query('#'+imageContainerId).classList.add('loading', 'iconfont');
    } else {
        // 关闭动画
        $query('#'+imageContainerId).classList.remove('loading', 'iconfont');
    }
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
    changeAnimation(true);
    clearBlobData();
    imageSetStack.push(base64ToBlob(src));
    executeStack();
}

/**
 * 释放blob数据
 */
function clearBlobData () {
    if (revokeStack.push.length > 0) {
        revokeBlobData(revokeStack.shift());
    }
}

/** 创建新的image实例 */
function createImage () {
    window_size();
    bindMouseOperation(document.getElementById(imageContainerId));
    if (!imageInstance) {
        imageInstance = new Image();
        executeStack();
    }
}

/** 销毁image实例 */
function destroyImage () {
    // 释放blob数据
    clearBlobData();
    // 解除事件绑定
    unbindMouseOperation(document.getElementById(imageContainerId));
    window.removeEventListener('resize', size_debounce);
    window.removeEventListener('load', createImage);
    window.removeEventListener('message', receiveMessage);
    document.body.removeEventListener('dblclick', image_transform_reset);
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
    // 数据设置
    operationTarge.scale = 1;
    operationTarge.left = 0;
    operationTarge.top = 0;
    // 最小范围
    operationTarge.minLeft = -1 * ((image_width * (1 - operationTarge.translateRate)) + left);
    operationTarge.minTop = -1 * ((image_height * (1 - operationTarge.translateRate)) + top);
    // 最大范围
    operationTarge.maxLeft = (image_width * (1 - operationTarge.translateRate)) + left;
    operationTarge.maxTop = (image_height * (1 - operationTarge.translateRate)) + top;
}

/** 保留指定小数 */
function decimal (number, t = 3) {
    return +number.toFixed(t);
}

/**
 * 发送消息
 * @param {{name:string,value?:any}} options
 */
function sendMessage (options={}) {
    if (options && typeof options === 'object') {
        options.group = 'viewImage';
        vscode.postMessage(options);
    }
}

/**
 * 重置图片操作
 */
function image_transform_reset () {
    operationTarge.scale = 1;
    operationTarge.left = 0;
    operationTarge.top = 0;
    document.getElementById(imageContainerId).style.transform = '';
}