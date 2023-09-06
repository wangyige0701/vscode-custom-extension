/* index(1) */

const vscode = acquireVsCodeApi();

/** 图片容器id */
const imageContainerId = 'image';

/** 图片标签实例 @type {HTMLImageElement} */
var imageInstance = null,
window_width = 0,
window_heigth = 0,
image_width = 0,
image_height = 0,
re_image_width = 0,
re_image_height = 0;

/** 是否正则执行 */
var isRunning = false;

/** @type {string[]} 存放图片路径 */
const imageSetStack = [];

/** @type {string[]} 存放需要释放的blob路径 */
const revokeStack = [];

/** 发送消息实例 */
const sendMessage = createSendMessage('viewImage', vscode);

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
};

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
        if (!change) {
            return;
        }
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
            func: setQueue,
            data: true
        }
    },
    /** 图片重新渲染 */
    changeViewState: {
        execute: {
            func: setQueue,
            data: true
        }
    },
    /** 图片数据销毁 */
    clearImageData: {
        execute: {
            func: clearOldImage,
            data: true
        }
    }
});

/** 接收扩展侧发送的消息 */
function receiveMessage ({ data }) {
    if (data.group !== 'viewImage') {
        return;
    }
    // 执行通讯传递数据
    messageReceiver(data.name, data.value);
}

/** 移除图片 */
function removeImage () {
    /** @type {HTMLElement} */
    let target = $query('#'+imageContainerId);
    if (target.childElementCount > 0) {
        target.removeChild(imageInstance);
    }
    target.style.cssText = '';
}

/** 
 * 刷新图片样式
 * @param {string} src
 *  */
function changeImageStyle (src) {
    return new Promise((resolve, reject) => {
        // 状态置为false，不允许继续改变
        isRunning = true;
        if (!imageInstance || !src) {
            reject(src??'');
            return;
        }
        operationTarge.can = false;
        revokeStack.push(src);
        loadImage(src, function () {
            window.requestAnimationFrame(() => {
                re_image_width = imageInstance.width, re_image_height = imageInstance.height;
                complete_size();
                changeAnimation(false);
                $query('#'+imageContainerId).append(imageInstance);
                // 修改图片位置
                image_position();
                operationTarge.can = true;
                resolve();
            });
        });
    });
}

/**
 * 切换动画
 * @param {boolean} state 
 */
function changeAnimation (state = true) {
    /** @type {HTMLElement} */
    const target = $query('#'+imageContainerId),
    names = ['loading', 'iconfont'],
    /** 是否含有指定类名 */
    check = names.every(item => target.classList.contains(item));
    if (state && !check) {
        target.classList.add('loading', 'iconfont');
        return;
    } 
    if (!state && check) {
        // 关闭动画
        target.classList.remove('loading', 'iconfont');
        return;
    }
}

/** 计算图片显示尺寸 */
function complete_size () {
    const window_rate = decimal(window_width / window_heigth), 
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
    };
    imageInstance.src = src;
}

/** 队列内容执行 */
function executeQueue () {
    if (imageSetStack.length <= 0) {
        isRunning = false;
        return;
    }
    changeImageStyle(imageSetStack.shift()).catch(src => {
        // 如果没有image实例，则释放blob路径数据
        revokeBlobData(src);
    }).finally(() => {
        executeQueue();
    });
}

/** 图片切换时释放上一张图片资源 */
function clearOldImage (data) {
    removeImage();
    changeAnimation(true);
    clearBlobData();
    if (!data) {
        return;
    }
    sendMessage({
        name: 'clearImageSuccess',
        value: true
    });
}

/** 队列插入数据 */
function setQueue (src) {
    clearOldImage(false);
    imageSetStack.push(base64ToBlob(src));
    if (!isRunning) {
        executeQueue();
    }
}

/** 释放blob数据 */
function clearBlobData () {
    if (revokeStack.length > 0) {
        revokeBlobData(revokeStack.shift());
    }
}

/** 创建新的image实例 */
function createImage () {
    window_size();
    bindMouseOperation(document.getElementById(imageContainerId));
    if (!imageInstance) {
        imageInstance = new Image();
        executeQueue();
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
    if (!imageInstance || image_width <= 0 || image_height <= 0) {
        return;
    }
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

/** 重置图片操作 */
function image_transform_reset () {
    operationTarge.scale = 1;
    operationTarge.left = 0;
    operationTarge.top = 0;
    document.getElementById(imageContainerId).style.transform = '';
}