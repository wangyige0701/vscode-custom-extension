/* index(10) */

/** vscode api */
const vscode = acquireVsCodeApi();

/** 当前选择查看的图片 @type {string|null} */
let nowSelectViewImage = null;

/** 公共数据 */
const publicData = {
    /** 在首次加载完图片之前不允许点击 */
    canSelect: false,
    /** 背景透明度 */
    backgroundOpacity: 0,
    /** @type {{src:string,code:string,init:boolean}[] | null} 图片列表渲染数组 */
    imageRenderList: null
};

/** 图标编码 */
const iconCode = {
    loadingSingle: '&#xe8fd;',
    image: '&#xe645;',
    opacity: '&#xe60d;',
    confirm: '&#xe616;',
    delete: '&#xe601;',
    select: '&#xe640;'
};

/** 按钮锁集合 */
const lockSet = {
    /** 输入框确认按钮*/
    inputConfirm: false,
    /** 上传图片按钮 */
    selectFile: false
};

/** 列表操作实例，构造函数内重写渲染列表get、set方法 */
const listInstance = createInstance();

/** 主函数操作队列 @type {Queue} */
const operationQueue = new Queue(false);

/** 图片新增处理的队列 @type {Queue} */
const addImageQueue = new Queue(false);

/** 懒加载图片触发函数 @type {{ code: string, callback: Function}[]} */
const lazyLoadImageList = [];

/**
 * 发送消息
 * @type {(options: {
 * name: 
 *      |'backgroundInit'
 *      |'selectImage'
 *      |'deleteImage'
 *      |'randomBackground'
 *      |'settingBackground'
 *      |'getBackgroundBase64Data'
 *      |'viewBigImage'
 *      |'externalImage'
 *      |'backgroundOpacity',
 * value:any
 * }) => any}
 */
const sendMessage = createSendMessage('background', vscode);

// 初始加载所有图片
window.addEventListener('load', onDataLoad.bind(this, false));

// 销毁前释放所有blob资源
window.addEventListener('unload', () => {
    publicData.imageRenderList?.forEach(target => {
        revokeBlobData(target.src);
    });
});

// 添加图片按钮点击事件绑定
getId(queryNames.selectButtonId)?.addEventListener('click', buttonClickSelectImage);

// 批量删除按钮绑定事件
getId(queryNames.batchDeleteId)?.addEventListener('click', canChangeForButton.bind(this, buttonClickDeleteSelect));

// 批量随机设置背景图事件
getId(queryNames.randomBackId)?.addEventListener('click', canChangeForButton.bind(this, buttonClickRandomBackground));

// 全选按钮点击事件
getId(queryNames.selectAllId)?.addEventListener('click', canChangeForButton.bind(this, buttonClickSelectAll));

// 取消全选按钮点击事件
getId(queryNames.selectCancelId)?.addEventListener('click', canChangeForButton.bind(this, buttonClickSelectCancel));

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

/** 修改点击状态，不会从true改为false，只有初始化后调用 */
function changeState (state) {
    if (state && !publicData.canSelect) {
        publicData.canSelect = true;
        // 如果数组长度小于等于0，则展示空列表提示内容
        let length = publicData.imageRenderList?.length??0;
        if (length <= 0) {
            listInstance.changeImageListInfo(true, false);
        }
    }
}

/** 接收消息通讯并执行对应函数的实例对象 @type {(name: string, value: any) => any} */
const messageReceiver = messageDataExecute({
    queue: operationQueue.set.bind(operationQueue),
    backgroundInitData: {
        queue: false,
        execute: {
            func: initImageData,
            data: true
        }
    },
    /** 发送code编码后接收到的base64数据 */
    backgroundSendBase64Data: {
        queue: true,
        execute: {
            func: getBase64DataToLoad,
            data: true
        }
    },
    /** value: string[]，添加的新图片路径和对应hashCode */
    newImage: {
        queue: true,
        extra: () => {lockSet.selectFile = false;},
        execute: {
            func: addImageHandle,
            data: true
        } 
    },
    /** value: string | array，确定删除图片 */
    deleteImageSuccess: {
        queue: true,
        execute: {
            func: deleteImageHandle,
            data: true
        }
    },
    /** value: number | string，点击图片处理完成，返回列表内对象，修改显示状态 */
    settingBackgroundSuccess: {
        queue: true,
        execute: {
            func: listInstance.imageClickHandle.bind(listInstance),
            data: true
        }
    },
    /** 通过网络地址下载图片 */
    newImageNetwork: {
        queue: true,
        extra: () => {lockSet.inputConfirm = false;},
        execute: [{
            func: addImageHandle,
            data: true,
        }, {
            func: inputSendDataComplete,
            noneParam: true
        }]
    },
    /** 初始化和设置透明度后返回 */
    nowBackgroundOpacity: {
        queue: true,
        extra: () => {lockSet.inputConfirm = false;},
        execute: {
            func: opacityMessageGetHandle,
            data: true
        }
    },
    /** 图片储存路径更改，重新请求初始化 */
    backgroundStorePathChange: {
        queue: true,
        execute: {
            func: onDataLoad,
            param: true
        }
    },
    /** 随机设置背景图状态更改或这初始化获取状态 */
    backgroundRandomList: {
        queue: true,
        execute: {
            func: changeRenderByRandomSetting,
            data: true
        }
    }
});

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
    if (data.group !== 'background') {
        return;
    }
    // 执行消息触发函数
    messageReceiver(data.name, data.value);
    // 将对应函数插入队列后，根据canSelect的值判断是否可以执行
    queueExecute(canChange());
}

/** 加载时初始化图片数据 */
function onDataLoad (reload=false) {
    if (reload === true) {
        publicData.canSelect = false;
        // 重置图片不需要滚动消失动画
        listInstance.deleteMultipleImages(deleteAllImage);
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
 * 队列顶端取出函数执行
 * @param {boolean} state 是否立即执行的状态，为false则代表当前不能立刻执行队列函数
 */
function queueExecute (state=false) {
    if (!state) {
        return;
    }
    changeState(state);
    // 当canChange()为false后不再继续执行下一个函数
    operationQueue.execute(canChange());
}

/** 选择图片按钮点击 */
function buttonClickSelectImage () {
    if (!canChange() || lockSet.selectFile) {
        return;
    }
    lockSet.selectFile = true;
    sendMessage({
        name: 'selectImage',
        value: true
    });
}

/** 根据能否点击变量判断是否触发函数 */
function canChangeForButton (callback) {
    if (!canChange()) {
        return;
    }
    callback?.();
}

/** 删除选中的图片 */
function buttonClickDeleteSelect () {
    if (listInstance.selectImageList.length > 0) {
        sendMessage({
            name: 'deleteImage',
            value: listInstance.getSelectListByArray()
        });
    }
}

/** 设置随机背景图，空数组代表从所有图片中设置，或者取消背景图的设置 */
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

/** 选中列表所有图片 */
function buttonClickSelectAll () {
    listInstance.getChild.forEach(child => {
        const code = listInstance.getCodeValue(child);
        if (code && !listInstance.selectImageList.includes(code)) {
            listInstance.clickToChangeSelectImageIcon(code);
        }
    });
}

/** 取消列表所有图片的选中 */
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
function firstLoadImages (array, callback = void 0) {
    for (const code of array) {
        publicData.imageRenderList?.push({
            init: true,
            code
        });
    }
    callback?.();
}

/**
 * 获取数据后根据对应编码和类型触发不同方法
 * @param {{ code: string, data: string, type: 'lazyLoad'|'addImage' }} options 
 */
function getBase64DataToLoad ({ code, data, type }) {
    if (type === 'lazyLoad') {
        // 懒加载图片
        let index = lazyLoadImageList.findIndex(item => item.code === code);
        if (index < 0) {
            return;
        }
        // 加载后移除数组元素并执行回调函数
        let target = lazyLoadImageList.splice(index, 1)?.[0];
        target?.callback?.(base64ToBlob(data), code);
    } else if (type === 'addImage') {
        // 新增图片的数据获取
        Promise.resolve(
            addImage(data, code)
        ).then(() => {
            addImageQueue.execute(false);
        }).catch(err => {
            throw err;
        });
    }
}

/** 删除所有图片 */
function deleteAllImage () {
    // 提前赋值，防止操作数组时长度实时改变
    const length = publicData.imageRenderList?.length??0;
    publicData.imageRenderList.splice(0, length);
}

/**
 * 接收数据并删除指定图片
 * @param {Array<string> | string} value 
 */
function deleteImageHandle (value) {
    if (Array.isArray(value)) {
        let call = () => {
            value.forEach((item) => {
                deleteImage(item);
            });
        };
        // 根据长度判断是否需要滚动动画
        value.length > 1 ? listInstance.deleteMultipleImages(call, value.length) : call();
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
 * 新增数据处理，根据哈希码数组依次获取图片数据并插入
 * @param {string[]} datas
 */
function addImageHandle (datas) {
    function req (code) {
        sendMessage({
            name: 'getBackgroundBase64Data',
            value: { code, type: 'addImage', thumbnail: true }
        });
    }
    // 倒序插入
    for (const code of datas) {
        addImageQueue.set(req.bind(null, code));
    }
    // 队列执行，每一步函数执行结束不会立刻执行下一个，等待触发
    addImageQueue.execute(false);
}

/** 判断当前是否正在滚动列表到顶部，如果是则需要将图片数据插入数组，等待滚动完成插入 */
var isScrollToTopAndAddImage = false;

/** 存放等待被插入的图片数据 @type {{src:string,code:string}[]} */
const listForAddImage = [];

/**
 * 顶部添加一张图片，异步处理
 * @param {string} src 图片数据
 * @param {string} code 图片哈希码 
 */
function addImage (src, code) {
    return new Promise((resolve, reject) => {
        try {
            /** @type {Element} */
            const target = $query('#'+queryNames.listId);
            if (!target || !(target instanceof Element)) {
                resolve();
                return;
            }
            // 先转换为blob路径
            src = base64ToBlob(src);
            if (target.scrollTop <= 0) {
                // 已经在顶部
                isScrollToTopAndAddImage = false;
                publicData.imageRenderList?.unshift({ code, src });
                raf(resolve, 300);
                return;
            }
            // 数据插入数组
            listForAddImage.push({ code, src });
            // isScrollToTopAndAddImage为true则代表已经在滚动中，插入图片进入数组就可以直接跳出
            if (isScrollToTopAndAddImage) {
                resolve();
                return;
            }
            isScrollToTopAndAddImage = true;
            // 容器滚动
            elementScrollTo(target, { top: 0, behavior: 'smooth' });
            // 滚动到顶部后再插入图片
            animationFrameResult(() => target.scrollTop <= 0, () => {
                isScrollToTopAndAddImage = false;
                const { src: $src, code: $code } = listForAddImage.shift();
                publicData.imageRenderList?.unshift({ code: $code, src: $src });
                raf(resolve, 300);
            });
        } catch (error) {
            reject(error);
        }
    });
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
    const button = getId(queryNames.selectButtonId);
    const icon = button.querySelector('.'+queryNames.selectButtonLoadingClass);
    if (!icon) {
        return;
    }
    if (value) {
        // 为true上锁，添加加载图标
        button.classList.add(queryNames.judgeLoading);
        icon.innerHTML = iconCode.loadingSingle;
        icon.classList.add(queryNames.loadingClass);
    } else {
        // 删除加载图标
        button.classList.remove(queryNames.judgeLoading);
        icon.innerHTML = null;
        icon.classList.remove(queryNames.loadingClass);
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
    if (!target) {
        return;
    }
    const list = target?.classList;
    if (list) {
        name.forEach(item => {
            if (item) {
                list[operation]?.(item);
            }
        });
    }
    return list;
}

/**
 * 判断对象是否含有某个属性
 * @param {Object} object 
 * @param {string[]} property 
 * @returns {boolean}
 */
function objectHas (object, ...property) {
    if (!object || typeof object !== 'object') {
        return false;
    }
    let result = true;
    for (const val of property) {
        if (!object.hasOwnProperty(val)) {
            result = false;
            break;
        }
    }
    return result;
}