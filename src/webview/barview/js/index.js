/* index(1) */

const vscode = acquireVsCodeApi();

const selectButtonId = 'selectImage'; // 选择图片的按钮
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

var canSelect = false; // 在首次加载完图片之前不允许点击

// 列表操作实例
const listInstance = createInstance();

// 添加图片按钮点击事件绑定
document.getElementById(selectButtonId).addEventListener('click', buttonClickSelectImage);
// 脚本侧通信接收事件
window.addEventListener('message', receiveMessage);

// 初始加载所有图片
onload();

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
 * 选择图片按钮点击
 */
function buttonClickSelectImage () {
    if (!canSelect) return;
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
 * 
 * @param {{data:{name:string,value:any,group:string}}} param 
 */
function receiveMessage ({ data }) {
    if (data.group !== 'background') return;
    const value = data.value;
    switch (data.name) {
        case 'backgroundInitData':
            canSelect = true;
            initImageData(value);
            break;
        case 'newImage':
            // value: string[]，添加的新图片路径和对应hashCode
            listInstance.addImageItem(...value);
            break;
        case 'deleteImageSuccess':
            // value: number | array，确定删除图片
            deleteImageHandle(value);
            break;
        case 'settingBackgroundSuccess':
            // value: number | string，点击图片处理完成，返回列表内对象，修改显示状态
            listInstance.imageClickHandle(value);
            break;
        default:
            break;
    }
}

/**
 * 初始化图片加载
 * @param {string[][]} array 
 */
function initImageData (array) {
    if (array.length > 0) {
        array.forEach((item, index) => {
            listInstance.addImageItem(...item.concat(index));
        });
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
function createELement (name, option={}) {
    const el = document.createElement(name);
    Object.keys(option).forEach(item => {
        el.setAttribute(item, option[item]);
    });
    return el;
}