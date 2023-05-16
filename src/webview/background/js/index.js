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
const imageListInfoId = 'imageListInfo'; // 图片列表展示文字提示区域容器
const imageListInfoIcon = '.image-list-info>.iconfont';
const imageListInfoContent = '.image-list-info>.info-content';
const imageListInfoShowClass = 'show';
const imageListInfoEmpty = '暂无背景图数据，请上传';
const imageListInfoEmptyLoading = '背景图数据加载中';

/**
 * 公共数据
 */
const publicData = {
    /**
     * 在首次加载完图片之前不允许点击
     */
    canSelect: false,
    /**
     * 背景透明度
    */
    backgroundOpacity: 0,
    /**
     * 图片列表渲染数组
     * @type {{src:string,code:string}[] | null}
    */
    imageRenderList: null
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

// 列表操作实例，构造函数内重写渲染列表get、set方法
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
 * 当前是否可以点击或修改其余元素
 * @returns {boolean}
 */
function canChange () {
    return publicData.canSelect;
}

/**
 * 修改点击状态，不会从true改为false，只有初始化后调用
 */
function changeState (state) {
    if (state && !publicData.canSelect) {
        publicData.canSelect = true;
        // 如果数组长度小于等于0，则展示空列表提示内容
        let length = publicData.imageRenderList?.length??0;
        if (length <= 0)
            listInstance.changeImageListInfo(true);
    }
}

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
            if (value) queueSet(addImage(...value));
            break;
        case 'deleteImageSuccess':
            // value: string | array，确定删除图片
            queueSet(deleteImageHandle(value));
            break;
        case 'settingBackgroundSuccess':
            // value: number | string，点击图片处理完成，返回列表内对象，修改显示状态
            queueSet(listInstance.imageClickHandle.bind(listInstance, value));
            break;
        case 'newImageNetwork':
            // 通过网络地址下载图片
            lockSet.inputConfirm = false;
            if (value) queueSet(addImage(...value), inputSendDataComplete);
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
    queueExecute(canChange());
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
function queueExecute (state=false) {
    changeState(state);
    if (operationQueue.length > 0 && state) {
        operationQueue.shift()?.();
        queueExecute(state);
    }
}

/**
 * 选择图片按钮点击
 */
function buttonClickSelectImage () {
    if (!canChange() || lockSet.selectFile) return;
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
    if (!canChange()) return;
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
 * 初始化图片加载
 * @param {string[][]} array 
 */
function initImageData (array) {
    if (array.length > 0) {
        delayAddImage(array, queueExecute);
    } else {
        // 如果初始没有图片，则直接执行队列
        queueExecute(true);
    }
}

/**
 * 延迟指定时间返回resolve的异步函数
 * @param {(data:any) => any)} callback 
 * @param {number} time 
 * @returns 
 */
function voidDelay (callback, time=500) {
    return new Promise(resolve => {
        callback();
        setTimeout(resolve, time);
    });
}

/**
 * 延迟加载所有图片
 * @param {string[][]} array 
 * @param {() => any} callback 
 */
async function delayAddImage (array, callback=undefined) {
    const length = array.length;
    for (let i = length - 1; i >= 0; i--) {
        await voidDelay(() => {
            publicData.imageRenderList?.unshift({
                src: array[i][0],
                code: array[i][1]
            });
        })
    }
    callback?.(true);
}

/**
 * 接收数据并删除指定图片
 * @param {Array<string> | string} value 
 */
function deleteImageHandle (value) {
    if (Array.isArray(value)) {
        value.forEach(item => {
            deleteImage(item);
        });
    } else {
        deleteImage(value);
    }
}

/**
 * 顶部添加一张图片
 * @param {{ code:string,src:string }} param 
 */
function addImage (src, code) {
    publicData.imageRenderList?.unshift({ code, src });
}

/**
 * 通过哈希码删除一张图片
 * @param {string} value 
 */
function deleteImage (value) {
    const index = publicData.imageRenderList?.findIndex(({ code }) => code === value);
    if (index >= 0) 
        publicData.imageRenderList?.splice(index, 1);
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
 * 通过querySelector获取元素
 * @param {string} value 
 * @returns {HTMLElement}
 */
function $query (value) {
    if (value) {
        return document.querySelector(value);
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

/**
 * 判断对象是否含有某个属性
 * @param {{}} object 
 * @param {string[]} property 
 * @returns 
 */
function objectHas (object, ...property) {
    if (typeof object !== 'object') return false;
    let result = true;
    for (let i = 0; i < property.length; i++) {
        if (!object.hasOwnProperty(property[i])) {
            result = false;
            break;
        }
    }
    return result;
}

/**
 * 设置innerHTML和innerText
 * @param {HTMLElement} target 
 * @param {'html'|'text'} type 
 * @param {string} content 
 */
function setHtmlText (target, type, content) {
    if (!target) return;
    if (type === 'html') {
        target.innerHTML = content;
    } else if (type === 'text') {
        target.innerText = content;
    }
}