(function () {
    const vscode = acquireVsCodeApi();

    const selectButtonId = 'selectImage'; // 选择图片的按钮
    const listId = 'list'; // 图片列表区域id
    const listImageClass = 'image-container';
    const imageContainerCodeName = 'data-code';
    const imageClass = 'image';
    const selectClass = 'select';
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
     * @param {String} code 
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
            array.forEach(item => {
                listInstance.addImageItem(...item);
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
                    throw new Error('没有对应元素');
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
             * 根据哈希码查找元素位置
             * @param {String} code 
             * @returns 
             */
            isCodeContain (code) {
                this.check();
                const list = this.getChild();
                let index = -1;
                for (let i = 0; i < list.length; i++) {
                    if (list[i].getAttribute(imageContainerCodeName) === code) {
                        index = i;
                        break;
                    }
                }
                return index;
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
                    let el = createELement('div', { class: listImageClass, [imageContainerCodeName]: code });
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
                    this.imageDeleteIconEventBind(deleteBut);
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
             * @param {Number|String} value 
             */
            deleteImageItem (value) {
                let thisEl;
                const listArray = this.getChild();
                if (typeof value === 'number' && value >= 0 && this.isChildLength(value)) {
                    thisEl = listArray[value];
                } else if (typeof value === 'string') {
                    const index = this.isCodeContain(value);
                    if (index < 0) return;
                    thisEl = listArray[index];
                } else {
                    return;
                }
                thisEl.classList.add('image-delete');

                const selectBut = thisEl.querySelector(
                    `.${imageButtonClass}.${imageSelectButtonClass}`
                );
                const deleteBut = thisEl.querySelector(
                    `.${imageButtonClass}.${imageDeleteButtonClass}`
                );

                // 解除事件绑定
                this.imageSelectIconEventUnbind(selectBut);
                this.imageDeleteIconEventUnbind(deleteBut);
                this.imageElementEventUnbind(thisEl);

                setTimeout(() => {
                    thisEl.remove();
                }, 300);
            }

            /**
             * 删除图标点击事件处理
             * @param {*} e 
             * @returns 
             */
            deleteOneImageIcon (e) {
                e.stopPropagation();
                if (!canSelect) return;
                const { path: [self, parent] } = e;
                const code = parent.getAttribute(imageContainerCodeName);
                if (code) iconClickDeleteImage(code);
            }

            /**
             * 选择图标点击事件处理
             * @param {*} e 
             * @returns 
             */
            selectOneImageIcon (e) {
                e.stopPropagation();
                if (!canSelect) return;
                const index = this.getPosition(e);
                if (index >= 0) this.toggleSelectStateToImageIcon(index);
            }

            getPosition ({ path: [self, parent, list] }) {
                const { children } = list;
                let i = 0;
                // 获取点击位置索引
                while (i < children.length) {
                    if (parent == children[i]) {
                        break;
                    }
                    i++;
                }
                return i;
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
                    classList.toggle(ImageSelectStateClass);
                    const select = this.selectImageList.findIndex(item => item === index);
                    if (classList.contains(ImageSelectStateClass)) {
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
                        classList.contains(ImageSelectStateClass)?classList.add(ImageSelectStateClass):null;
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
                    item.classList.remove(ImageSelectStateClass);
                });
            }

            imageDeleteIconEventBind(el) {
                if (el) el.addEventListener('click', this.deleteOneImageIcon.bind(this));
            }

            imageDeleteIconEventUnbind(el) {
                if (el) el.removeEventListener('click', this.deleteOneImageIcon.bind(this));
            }
            
            imageSelectIconEventBind(el) {
                if (el) el.addEventListener('click', this.selectOneImageIcon.bind(this));
            }
 
            imageSelectIconEventUnbind(el) {
                if (el) el.removeEventListener('click', this.selectOneImageIcon.bind(this));
            }

            /**
             * 绑定图片点击事件
             * @param {Element} el 
            */
            imageElementEventBind (el) {
                if (el) el.addEventListener('click', this.imageClick.bind(this));
            }

            /**
             * 解除事件绑定
             * @param {Element} el 
            */
            imageElementEventUnbind (el) {
                if (el) el.removeEventListener('click', this.imageClick.bind(this));
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
                if (!canSelect) return;
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