/* index(2) */

const inputInfo = {
    id: 'inputValue',
    selection: '.icon-container.input-change-icon>.iconfont',
    image: 'externalImage',
    opacity: 'setOpacity',
    confirm: 'confirm',
    clear: 'clear'
}

const inputPlaceholder = ['外部图片地址（https/http）', '透明度（输入0.1~1的任意数字）']; // 占位符内容

createInputEvent();

function createInputEvent () {
    // 输入框类型控制按钮列表
    let selection = document.querySelectorAll(inputInfo.selection);
    // 输入框对象
    let inputTarget = getId(inputInfo.id);
    // 确认按钮
    let confirm = getId(inputInfo.confirm);
    // 清除按钮
    let clear = getId(inputInfo.clear);

    let type = 0, value = '';

    let inputDataWatcher = Object.defineProperties({}, {
        type: {
            // 0是上传外部图片；1是修改透明度
            set (newValue) {
                if (newValue !== type && newValue < inputPlaceholder.length) {
                    console.log(inputTarget);
                    type = newValue;
                }
            },
            get () {
                return type;
            },
            enumerable: true,
            configurable: true
        },
        value: {
            // 缓存输入框数据
            enumerable: true,
            configurable: true,
            set (newValue) {
                if (typeof newValue === 'string' || typeof newValue === 'number') {
                    value = newValue;
                    inputTarget.value = value;
                }
            },
            get () {
                return value;
            }
        }
    });

    // 文本框输入更新对象属性
    inputTarget.oninput = function ({ target: { value } }) {
        inputDataWatcher.value = value;
        console.log(inputDataWatcher.value);
    }

    clear.onclick = function (e) {
        e.stopPropagation();
        inputTarget.value = "";
    }

    // 内存占用释放
    selection = null;
    confirm = null;
    clear = null;
}