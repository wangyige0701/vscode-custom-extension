(function () {
    const vscode = acquireVsCodeApi();

    const selectButtonId = 'selectImage'; // 选择图片的按钮
    const listId = 'list'; // 图片列表区域id
    const listImageClass = 'image-container';
    const imageClass = 'image';
    const selectClass = 'select';
    const imageButtonClass = 'image-operation'; // 图片操作按钮类名
    const imageSelectButtonClass = 'image-select'; // 图片选中按钮类名
    const imageDeleteButtonClass = 'image-delete'; // 图片删除按钮类名
    const circleBackIconClass = 'icon-circle-background'; // 圆形背景填充图标类名
    const deleteIconClass = 'icon-delete'; // 删除图标类名
    const ImageSelectStateClass = 'select'; // 图片选中类名

    // 列表操作实例
    const listInstance = createInstance();
    
    // 添加图片按钮点击事件绑定
    document.getElementById(selectButtonId).addEventListener('click', buttonClickSelectImage);
    // 脚本侧通信接收事件
    window.addEventListener('message', receiveMessage);

    /**
     * 选择图片按钮点击
     */
    function buttonClickSelectImage () {
        sendMessage({
            type: 'selectImage',
            value: true
        });
    }

    /**
     * 
     * @param {{data:{type:string,value:any}}} param 
     */
    function receiveMessage ({ data }) {
        switch (data.type) {
            case 'newImage':
                // value: string[]，添加的新图片路径和对应hashCode
                listInstance.addImageItem(...data.value);
                break;
            case 'deleteImage':
                // value: number | array，确定删除图片
                if (Array.isArray(data.value)) {
                    data.value.forEach(item => {
                        listInstance.deleteImageItem(item);
                    })
                } else {
                    listInstance.deleteImageItem(data.value);
                }
                break;
            default:
                break;
        }
    }

    /**
     * 发送消息
     */
    function sendMessage (options={}) {
        if (options && typeof options === 'object') {
            vscode.postMessage(options);
        }
    }

    /**
     * 创建标签元素
     * @param {String} name 标签名
     * @param {Object} option 属性
     * @returns {Element}
     */
    function createELement (name, option={}) {
        const el = document.createElement(name);
        Object.keys(option).forEach(item => {
            el.setAttribute(item, option[item]);
        });
        return el;
    }

    /**
     * 创建图片列表操作方法实例
     * @returns 
     */
    function createInstance () {
        class ImageList {
            selectImageList = [];

            constructor() {
                this.id = listId;
                this.element = document.getElementById(this.id);
            }

            check () {
                if (!this.element) {
                    return new Error('没有对应元素');
                }
            }

            /**
             * 获取子元素所有节点
             */
            getChild () {
                this.check();
                return this.element.querySelectorAll('.'+listImageClass);
            }

            /**
             * 字节点长度是否满足
             */
            isChildLength (length = 0) {
                this.check();
                return this.getChild().length > length;
            }

            /**
             * 是否有select类名
             * @returns {{select: boolean,index: number}}
             */
            hasSelect () {
                this.check();
                let type = false, index = -1;
                const child = this.getChild();
                for (let i = 0; i < child.length; i++) {
                    if (child[i].classList.contains(selectClass)) {
                        index = i;
                        type = true;
                        break;
                    }
                }
                return {
                    select: type,
                    index
                }
            }

            /**
             * 删除指定位置的select类名
             * @param {Number} index 索引
             */
            cancelSelect (index) {
                if (index >= 0) {
                    this.getChild()[index].classList.remove(selectClass);
                }
            }

            /**
             * 插入一个img节点
             * @param {*} src 图片路径
             * @returns 当前图片对应的哈希值
             */
            addImageItem (src, code) {
                if (src) {
                    // 外层容器
                    let el = createELement('div', { class: listImageClass, 'data-code': code });
                    // 图片本体
                    el.appendChild(createELement('img', { class: imageClass, loading: 'lazy', src }));
                    // 操作按钮
                    let selectBut, deleteBut;
                    el.appendChild(selectBut = createELement('span', { class: imageButtonClass }));
                    el.appendChild(deleteBut = createELement('span', { class: imageButtonClass }));
                    selectBut.classList.add(imageSelectButtonClass, circleBackIconClass);
                    deleteBut.classList.add(imageDeleteButtonClass, deleteIconClass);

                    // 事件绑定
                    this.imageSelectIconEventBind(selectBut);
                    this.imageElementEventBind(el);

                    if (this.element.childNodes.length === 0) {
                        this.element.appendChild(el);
                    } else {
                        // 在开头插入元素
                        this.element.insertBefore(el, this.element.firstChild);
                    }
                    el = null;
                }
            }

            /**
             * 删除一个图片元素
             * @param {Number} index 
             */
            deleteImageItem (index) {
                if (index >= 0 && this.isChildLength(index)) {
                    const listArray = this.getChild();
                    let thisEl = listArray[index];
                    thisEl.classList.add('image-delete');

                    const selectBut = thisEl.querySelector(
                        `.${imageButtonClass}.${imageSelectButtonClass}`
                    );

                    this.imageSelectIconEventUnbind(selectBut);
                    this.imageElementEventUnbind(thisEl);

                    setTimeout(() => {
                        thisEl.remove();
                    }, 300);
                    sendMessage({
                        type:'deleteImage',
                        value: thisEl.getAttribute('data-code')
                    });
                }
            }

            selectOneImageIcon (e) {
                e.stopPropagation();
                const { path: [self, parent, list] } = e;
                const { children } = list;
                let i = 0;
                // 获取点击位置索引
                while (i < children.length) {
                    if (parent == children[i]) {
                        this.toggleSelectStateToImageIcon(i);
                        break;
                    }
                    i++;
                }
            }

            /**
             * 对点击的元素进行选中状态切换并更新状态数组
             * @param {Number} index 索引
             * @returns 
             */
            toggleSelectStateToImageIcon (index) {
                if (index >= 0) {
                    const classList = this.getChild()[index].querySelector(
                        `.${imageButtonClass}.${imageSelectButtonClass}`
                    )?.classList;
                    if (!classList) return;
                    classList.toggle('select');
                    const select = this.selectImageList.findIndex(item => item === index);
                    if (classList.contains('select')) {
                        // 数组中没有对应索引则添加
                        select > -1 ? null : this.selectImageList.push(index);
                    } else {
                        // 数组中有对应索引并且索引对应元素不包含select类名，则删除
                        select > -1 ? this.selectImageList.splice(select, 1) : null;
                    }
                }
            }

            /**
             * 对选中的列表按钮添加选中类名
             */
            selectedImageIcon () {
                const child = this.getChild();
                this.clearAllSelectImageIcon(child);
                this.selectImageList.forEach(item => {
                    if (item >= 0 && child.length > item) {
                        const classList = child[item].querySelector(
                            `.${imageButtonClass}.${imageSelectButtonClass}`
                        )?.classList;
                        if (!classList) return;
                        classList.contains('select')?classList.add('select'):null;
                    }
                });
            }

            /**
             * 删除图片节点内的选中图标类名
             * @param {NodeList} child 子元素节点
             * @param {Boolean} clear 是否清除记录数组
             */
            clearAllSelectImageIcon (child, clear=false) {
                if (clear) {
                    // 是否删除数组
                    for (let i = this.selectImageList.length-1; i >= 0; i--) {
                        this.selectImageList.splice(i, 1);
                    }
                }
                if (!child) child = this.getChild();
                child.forEach(item => {
                    item.classList.remove('select');
                });
            }

            getHashCode (length = 24) {
                let str = '';
                length = Number(length) || 24;
                for (let i = 0; i < length; i++) {
                    str += Math.floor(Math.random() * 36).toString(36);
                }
                return str;
            }

            imageSelectIconEventBind(el) {
                if (el) {
                    el.addEventListener('click', this.selectOneImageIcon.bind(this));
                }
            }

            imageSelectIconEventUnbind(el) {
                if (el) {
                    el.removeEventListener('click', this.selectOneImageIcon.bind(this));
                }
            }

            /**
             * 绑定图片点击事件
             * @param {Element} el 
             */
            imageElementEventBind (el) {
                if (el) {
                    el.addEventListener('click', this.imageClick.bind(this));
                }
            }

            /**
             * 解除事件绑定
             * @param {Element} el 
             */
            imageElementEventUnbind (el) {
                if (el) {
                    el.removeEventListener('click', this.imageClick.bind(this));
                }
            }

            /**
             * 取消冒泡
             * @param {Element} el 
             */
            stopPropagation (el, event='click') {
                if (el) {
                    el.addEventListener(event,e => {
                        e.stopPropagation();
                    });
                }
            }

            /**
             * 绑定事件处理函数
             * @param {{target:Element}} param
             */
            imageClick ({ target }) {
                if (target.classList.contains(imageClass)) {
                    target = target.parentElement;
                }
                const { select, index } = this.hasSelect();
                if (select) this.cancelSelect(index);
                target.classList.add(selectClass);
            }
        }

        return new ImageList();
    }
})();