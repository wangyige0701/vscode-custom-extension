/* index(1) */

/**
 * vscode api
 */
const vscode = acquireVsCodeApi();

const selectButtonId = 'selectImage'; // 选择图片的按钮
const selectButtonLoadingCLass = 'iconfont'; // 选择文件按钮加载图片容器
const judgeLoading = 'isloading';
const loadingClass = 'loading-rotate';
const listId = 'list'; // 图片列表区域id
const listImageClass = 'image-container'; // 图片列表类名
const imageContainerCode = 'code';
const imageContainerCodeName = 'data-'+imageContainerCode; // 图片中用于存放code哈希码的属性名
const imageClass = 'image'; // 图片公用类名
const selectClass = 'select'; // 图片选中的类名
const imageButtonClass = 'image-operation'; // 图片操作按钮类名
const imageSelectButtonClass = 'image-select'; // 图片选中按钮类名
const imageDeleteButtonClass = 'image-delete'; // 图片删除按钮类名
const circleBackIconClass = 'icon-circle-background'; // 圆形背景填充图标类名
const deleteIconClass = 'icon-delete'; // 删除图标类名
const ImageSelectStateClass = 'select'; // 图片选中类名

const publicData = {
    backgroundOpacity: 0
}

/**
 * 图标编码
 */
const iconCode = {
    loadingSingle: '&#xe8fd;',
    image: '&#xe645;',
    opacity: '&#xe60d;',
    confirm: '&#xe616;',
    delete: '&#xe601;',
    select: '&#xe640;'
}

/**
 * 按钮锁集合
 */
const lockSet = {
    /**
     * 输入框确认按钮
    */
    inputConfirm: false,
    /**
     * 上传图片按钮
    */
    selectFile: false
};

/**
 * 在首次加载完图片之前不允许点击
 */
var canSelect = false;

// 列表操作实例
const listInstance = createInstance();

// 操作队列
const operationQueue = [];

// 添加图片按钮点击事件绑定
document.getElementById(selectButtonId).addEventListener('click', buttonClickSelectImage);
// 脚本侧通信接收事件
window.addEventListener('message', receiveMessage);

// 初始加载所有图片
onload();

// 注册上传按钮锁
registLock('selectFile', selectFileButtonLock);

/**
 * 注册通信数据接收事件
 * @param {{data:{name:string,value:any,group:string}}} param 
 */
function receiveMessage ({ data }) {
    if (data.group !== 'background') return;
    const value = data.value;
    switch (data.name) {
        case 'backgroundInitData':
            initImageData(value);
            break;
        case 'newImage':
            // value: string[]，添加的新图片路径和对应hashCode
            lockSet.selectFile = false;
            if (value) queueSet(listInstance.addImageItem.bind(listInstance, ...value));
            break;
        case 'deleteImageSuccess':
            // value: number | array，确定删除图片
            queueSet(deleteImageHandle.bind(listInstance, value));
            break;
        case 'settingBackgroundSuccess':
            // value: number | string，点击图片处理完成，返回列表内对象，修改显示状态
            queueSet(listInstance.imageClickHandle.bind(listInstance, value));
            break;
        case 'newImageNetwork':
            // 通过网络地址下载图片
            lockSet.inputConfirm = false;
            if (value) queueSet(listInstance.addImageItem.bind(listInstance, ...value), inputSendDataComplete);
            break;
        case 'nowBackgroundOpacity':
            // 初始化和设置透明度后返回
            lockSet.inputConfirm = false;
            queueSet(opacityMessageGetHandle(value));
            break;
        default:
            break;
    }
    // 将对应函数插入队列后，根据canSelect的值判断是否可以执行
    queueExecute(canSelect);
}

/**
 * 加载时初始化图片数据
 */
function onload () {
    sendMessage({
        name: 'backgroundInit',
        value: true
    });
}

/**
 * 队列插入数据
 * @param {Function[]} func 
 */
function queueSet (...func) {
    for (let i = 0; i < func.length; i++) {
        const item = func[i];
        if (typeof item !== 'function') break;
        operationQueue.push(item);
    }
}

/**
 * 队列顶端取出函数执行
 */
function queueExecute (start=false) {
    canSelect = start;
    if (operationQueue.length > 0 && start) {
        operationQueue.shift()?.();
        queueExecute(start);
    }
}

/**
 * 选择图片按钮点击
 */
function buttonClickSelectImage () {
    if (!canSelect || lockSet.selectFile) return;
    lockSet.selectFile = true;
    sendMessage({
        name: 'selectImage',
        value: true
    });
}

/**
 * 删除图标按钮点击
 * @param {string} code 
 * @returns 
 */
function iconClickDeleteImage (code) {
    if (!canSelect) return;
    sendMessage({
        name: 'deleteImage',
        value: code
    });
}

/**
 * 设置背景图样式
 * @param {string} code 
 */
function settingBackground (code) {
    sendMessage({
        name: 'settingBackground',
        value: code
    });
}

/**
 * 初始化图片加载
 * @param {string[][]} array 
 */
function initImageData (array) {
    if (array.length > 0) {
        let length = array.length;
        for (let i = length-1; i >= 0; i--) {
            // 最后一个元素传入queueExecute函数，在元素插入后开始执行队列中的方法
            listInstance.addImageItem(...array[i].concat(length - i - 1, i === 0 ? queueExecute : undefined));
        }
    } else {
        // 如果初始没有图片，则直接执行队列
        queueExecute(true);
    }
}

/**
 * 接收数据并删除指定图片
 * @param {Array<number|string> | number | string} value 
 */
function deleteImageHandle (value) {
    if (Array.isArray(value)) {
        value.forEach(item => {
            listInstance.deleteImageItem(item);
        });
    } else {
        listInstance.deleteImageItem(value);
    }
}

/**
 * 发送消息
 * @param {{name:string,value:any}} options
 */
function sendMessage (options={}) {
    if (options && typeof options === 'object') {
        options.group = 'background';
        vscode.postMessage(options);
    }
}

/**
 * 创建标签元素
 * @param {string} name 标签名
 * @param {object} option 属性
 * @returns {HTMLElement}
 */
function createELement (name, options={}) {
    const el = document.createElement(name);
    setAllAttribute(el, options);
    return el;
}

/**
 * 批量设置元素属性
 * @param {HTMLElement} el 
 * @param {Object} options 
 */
function setAllAttribute (el, options={}) {
    Object.keys(options).forEach(item => {
        el.setAttribute(item, options[item]);
    });
}

/**
 * 通过id获取元素
 * @param {string} id 
 * @returns {HTMLElement}
 */
function getId (id) {
    if (id) {
        return document.getElementById(id);
    }
}

/**
 * 输出在一个最小最大范围内的值
 * @param {number} min 
 * @param {number} max 
 * @param {number} value 
 * @returns {number}
 */
function minmax (min, max, value) {
    return value <= min ? min : value >= max ? max : value;
}

/**
 * 注册按钮锁
 */
function registLock (property, setback) {
    if (lockSet.hasOwnProperty(property)) {
        let value = lockSet[property];
        Object.defineProperty(lockSet, property, {
            set (newValue) {
                if (newValue !== value) {
                    value = newValue;
                    setback(value);
                }
            },
            get () {
                return value;
            }
        });
    }
}

/**
 * 图标按钮加载状态处理
 * @param {boolean} value 
 * @returns 
 */
function selectFileButtonLock (value) {
    const button = getId(selectButtonId);
    const icon = button.querySelector('.'+selectButtonLoadingCLass);
    if (!icon) return;
    if (value) {
        // 为true上锁，添加加载图标
        button.classList.add(judgeLoading);
        icon.innerHTML = iconCode.loadingSingle;
        icon.classList.add(loadingClass);
    } else {
        // 删除加载图标
        button.classList.remove(judgeLoading);
        icon.innerHTML = null;
        icon.classList.remove(loadingClass);
    }
}

/**
 * 类名操作集中处理
 * @param {HTMLElement} target 
 * @param {'add'|'remove'|'toggle'} operation 
 * @param  {string[]} name 
 * @returns 
 */
function classListOperation (target, operation, ...name) {
    if (!target) return;
    const list = target?.classList;
    if (list) {
        name.forEach(item => {
            list?.[operation]?.(item);
        });
    }
    return list;
}