/* index(1) */

/**
 * vscode api
 */
const vscode = acquireVsCodeApi();

/** 当前选择查看的图片 @type {string|null} */
let nowSelectViewImage = null;

const selectButtonId = 'selectImage'; // 选择图片的按钮
const selectButtonText = '选择本地图片';
const selectButtonLoadingCLass = 'iconfont'; // 选择文件按钮加载图片容器
const batchButtonContainerClass = 'batch-operation'; // 删除或批量设置按钮区域容器类名
const batchDeleteId = 'batchDelete'; // 批量删除按钮
const randomBackId = 'randomBack'; // 背景图随机设置按钮
const selectAllId = 'selectAll'; // 全部选中按钮
const selectCancelId = 'selectCancel'; // 取消选中按钮
const rendomAllBack = '随机切换（全部）';
const rendomSelectBack = '随机切换（选中）';
const closeRandom = '关闭随机切换';
const judgeLoading = 'isloading';
const loadingClass = 'loading-rotate';
const listId = 'list'; // 图片列表区域id
const listImageClass = 'image-container'; // 图片列表类名
const imageContainerCode = 'code';
const imageContainerCodeName = 'data-'+imageContainerCode; // 图片中用于存放code哈希码的属性名
const imageClass = 'image'; // 图片公用类名
const selectClass = 'select'; // 图片选中的类名
const imageIsRandomClass = 'random'; // 图片被选为随机设置的类名
const selectButtonToContainerClass = 'container-icon-select'; // 左上角图标选中时图片容器的类名
const imageButtonClass = 'image-operation'; // 图片操作按钮类名
const imageSelectButtonClass = 'image-select'; // 图片选中按钮类名
const imageDeleteButtonClass = 'image-delete'; // 图片删除按钮类名
const circleBackIconClass = 'icon-circle-background'; // 圆形背景填充图标类名
const deleteIconClass = 'icon-delete'; // 删除图标类名
const ImageSelectStateClass = 'select'; // 图片左上角图标选中类名
const imageListInfoId = 'imageListInfo'; // 图片列表展示文字提示区域容器
const imageListInfoIcon = '.image-list-info>.iconfont'; // 图片列表文字提示区域图标
const imageListInfoContent = '.image-list-info>.info-content'; // 图片列表提示区域文字容器
const imageListInfoShowClass = 'show'; // 显示文字提示类名
const imageListInfoEmpty = '暂无背景图数据，请上传';
const imageListInfoEmptyLoading = '背景图数据加载中';
const imageAnimationTime = 500; // 图片加载删除动画时间

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
     * @type {{src:string,code:string,init:boolean}[] | null}
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

/** 列表操作实例，构造函数内重写渲染列表get、set方法 */
const listInstance = createInstance();

/** @type {Function[]} 操作队列 */
const operationQueue = [];

/** @type {{ code: string, callback: Function}[]} 懒加载图片触发函数 */
const lazyLoadImageList = [];

// 初始加载所有图片
window.addEventListener('load', onDataLoad.bind(this, false));

// 销毁前释放所有blob资源
window.addEventListener('unload', () => {
    publicData.imageRenderList?.forEach(target => {
        revokeBlobData(target.src);
    });
});

// 添加图片按钮点击事件绑定
getId(selectButtonId)?.addEventListener('click', buttonClickSelectImage);

// 批量删除按钮绑定事件
getId(batchDeleteId)?.addEventListener('click', canChangeForButton.bind(this, buttonClickDeleteSelect));

// 批量随机设置背景图事件
getId(randomBackId)?.addEventListener('click', canChangeForButton.bind(this, buttonClickRandomBackground));

// 全选按钮点击事件
getId(selectAllId)?.addEventListener('click', canChangeForButton.bind(this, buttonClickSelectAll));

// 取消全选按钮点击事件
getId(selectCancelId)?.addEventListener('click', canChangeForButton.bind(this, buttonClickSelectCancel));

// 脚本侧通信接收事件
window.addEventListener('message', receiveMessage);

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
            listInstance.changeImageListInfo(true, false);
    }
}

/**
 * 注册通信数据接收事件
 * @param {{data:{name:string,value:any,group:string}}} param 
 */
function receiveMessage ({ data }) {
    if (data.group === 'viewImageDestroy' && data.name === 'viewImageDestroyToBackground') {
        // 查看大图实例销毁
        nowSelectViewImage = null;
        return;
    }
    if (data.group !== 'background') return;
    const value = data.value;
    switch (data.name) {
        case 'backgroundInitData':
            initImageData(value);
            break;
        case 'backgroundSendBase64Data':
            // 发送code编码后接收到的base64数据
            if (value) queueSet(getBase64DataToLoad.bind(this, value));
            break;
        case 'newImage':
            // value: string[]，添加的新图片路径和对应hashCode
            lockSet.selectFile = false;
            if (value) queueSet(addImage.apply(this, value));
            break;
        case 'deleteImageSuccess':
            // value: string | array，确定删除图片
            queueSet(deleteImageHandle.bind(this, value));
            break;
        case 'settingBackgroundSuccess':
            // value: number | string，点击图片处理完成，返回列表内对象，修改显示状态
            queueSet(listInstance.imageClickHandle.bind(listInstance, value));
            break;
        case 'newImageNetwork':
            // 通过网络地址下载图片
            lockSet.inputConfirm = false;
            if (value) queueSet(addImage.apply(this, value), inputSendDataComplete);
            break;
        case 'nowBackgroundOpacity':
            // 初始化和设置透明度后返回
            lockSet.inputConfirm = false;
            queueSet(opacityMessageGetHandle.bind(this, value));
            break;
        case 'backgroundStorePathChange':
            // 图片储存路径更改，重新请求初始化
            if (value) queueSet(onDataLoad.bind(this, true));
            break;
        case 'backgroundRandomList':
            // 随机设置背景图状态更改或这初始化获取状态
            queueSet(changeRenderByRandomSetting.bind(this, value));
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
function onDataLoad (reload=false) {
    if (reload === true) {
        publicData.canSelect = false;
        deleteAllImage();
        listInstance.changeImageListInfo(true, true);
    }
    // 重置状态
    listInstance.reset();
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
        if (typeof item !== 'function') 
            continue;
        operationQueue.push(item);
    }
}

/**
 * 队列顶端取出函数执行
 */
function queueExecute (state=false) {
    if (!state) return;
    changeState(state);
    if (operationQueue.length > 0) {
        operationQueue.shift()?.();
        // 队列长度大于0继续执行
        operationQueue.length > 0 ? queueExecute(state) : null;
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
 * 根据能否点击变量判断是否触发函数
 */
function canChangeForButton (callback) {
    if (canChange()) callback?.();
}

/**
 * 删除选中的图片
 */
function buttonClickDeleteSelect () {
    if (listInstance.selectImageList.length > 0) {
        sendMessage({
            name: 'deleteImage',
            value: listInstance.getSelectListByArray()
        });
    }
}

/**
 * 设置随机背景图，空数组代表从所有图片中设置，或者取消背景图的设置
 */
function buttonClickRandomBackground () {
    let value = false;
    if (listInstance.settingRandomButtonTextState > 1) {
        // 当前未随机设置背景图或者勾选的图片数量大于1，则进行随机背景图的设置，发送字符串数组
        value = listInstance.getSelectListByArray();
    }
    sendMessage({
        name: 'randomBackground',
        value
    });
}

/**
 * 选中列表所有图片
 */
function buttonClickSelectAll () {
    listInstance.getChild()?.forEach(child => {
        let code;
        if ((code = listInstance.getCodeValue(child)) && !listInstance.selectImageList.includes(code)) {
            listInstance.selectImageList.push(code);
        }
    });
}

/**
 * 取消列表所有图片的选中
 */
function buttonClickSelectCancel () {
    let length = listInstance.selectImageList.length;
    if (length > 0) {
        let i = 0;
        while (i < length) {
            listInstance.selectImageList.splice(i, 1);
            length--;
        }
    }
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
        value: [code]
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
 * @param {string[]} array 
 */
function initImageData (array) {
    if (array.length > 0) {
        firstLoadImages(array, queueExecute.bind(this, true));
    } else {
        // 如果初始没有图片，则直接执行队列
        queueExecute(true);
    }
}

/**
 * 首次加载图片列表时的处理方法，使用懒加载分批次加载所有图片
 * @param {string[]} array 
 * @param {Function} callback 
 */
function firstLoadImages (array, callback=undefined) {
    for (let i = 0; i < array.length; i++) {
        const code = array[i]
        publicData.imageRenderList?.push({
            init: true,
            code: code
        });
    }
    callback?.();
}

/**
 * 注册一个懒加载图片触发方法，类型是lazyLoad
 * @param {string} code 
 * @param {Function} callback 
 */
function registLazyLoadImage (code, callback) {
    if (!code || !callback) return;
    lazyLoadImageList.push({ code, callback });
    // 发送编码获取base64数据
    sendMessage({
        name: 'getBackgroundBase64Data',
        value: { code, type: 'lazyLoad' }
    });
}

/**
 * 获取数据后根据对应编码和类型触发不同方法
 * @param {{ code: string, data: string, type: string }} options 
 */
function getBase64DataToLoad ({ code, data, type }) {
    if (type === 'lazyLoad') {
        // 懒加载图片
        let index = lazyLoadImageList.findIndex(item => item.code === code);
        if (index < 0) return;
        // 加载后移除数组元素并执行回调函数
        let target = lazyLoadImageList.splice(index, 1)?.[0];
        target?.callback?.(base64ToBlob(data));
    }
}

/**
 * 删除所有图片
 */
function deleteAllImage () {
    // 提前赋值，防止操作数组时长度实时改变
    let length = publicData.imageRenderList?.length??0;
    publicData.imageRenderList.splice(0, length);
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
    // 清除选中数组的数据
    for (let i = 0; i < listInstance.selectImageList.length; i++) {
        let item = listInstance.selectImageList[i];
        if (item === value || value.includes(item)) {
            listInstance.selectImageList.splice(i--, 1);
        }
    }
}

/**
 * 顶部添加一张图片
 * @param {{ code:string,src:string }} param 
 */
function addImage (src, code) {
    publicData.imageRenderList?.unshift({ code, src: base64ToBlob(src) });
}

/**
 * 通过哈希码删除一张图片
 * @param {string} value 
 */
function deleteImage (value) {
    const index = publicData.imageRenderList?.findIndex(({ code }) => code === value);
    if (index >= 0) {
        // 清除数组内容
        publicData.imageRenderList?.splice(index, 1);
    }
}

/**
 * 根据当前是否设置了随机切换背景图的状态更改渲染
 * @param {string[]|false} data 
 * @returns 
 */
function changeRenderByRandomSetting (data) {
    if (data === false) {
        listInstance.isRandomBackground = false;
        listInstance.deleteAllRandomSelectClass();
    } else if (Array.isArray(data)) {
        listInstance.isRandomBackground = true;
        listInstance.changeImageStyleToRandomSelect(data);
    }
    listInstance.settingRandomButtonText();
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

/**
 * 判断对象是否含有某个属性
 * @param {{}} object 
 * @param {string[]} property 
 * @returns {boolean}
 */
function objectHas (object, ...property) {
    if (!object || typeof object !== 'object') return false;
    let result = true;
    for (let i = 0; i < property.length; i++) {
        if (!object.hasOwnProperty(property[i])) {
            result = false;
            break;
        }
    }
    return result;
}