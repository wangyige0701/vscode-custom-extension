/* index(3) */

/**
 * 创建图片列表操作方法实例
 * @returns 
 */
function createInstance () {
    const imageDeleteCLass = 'image-delete';
    class ImageList {
        selectImageList = []; // 记录选中的元素
        imageInfoEmpty;
        imageInfoLoading;

        constructor() {
            // 初始化时更新加载状态
            this.changeImageListInfo(true, true);
            this.id = listId;
            this.element = getId(this.id);
            // 代理数组双向绑定
            publicData.imageRenderList = new Proxy([], {
                set: this.#set.bind(this),
                get: this.#get.bind(this)
            });
            publicData.imageRenderList.__proto__ = this.#resetMethods(this);
        }

        /**
         * 重置数组的操作方法，将数据和元素操作进行绑定
         * @param {ImageList} _this
         */
        #resetMethods (_this) {
            const oldMethods = Array.prototype;
            const newMethods = Object.create(oldMethods);
            const methods = ['push', 'pop', 'shift', 'unshift', 'splice'];
            methods.forEach(method => {
                newMethods[method] = function (...args) {
                    switch (method) {
                        case 'push':
                        case 'unshift':
                            args.forEach(arg => {
                                if (objectHas(arg, 'src', 'code')) 
                                    arg.target = _this.#addImageItem(arg, method==='unshift'); // 元素对象
                            });
                            break;
                        case 'pop':
                        case 'shift':
                            args.forEach(arg => {
                                _this.#deleteImageItem(arg.target);
                            });
                            break;
                        case 'splice':
                            if (args.slice(2).length === 0) 
                                // 只处理通过splice删除元素
                                for (let i = 0; i < args[1]; i++) {
                                    _this.#deleteImageItem(this[args[0]+i].target);
                                }
                            break;
                        default:
                            break;
                    }
                    return oldMethods[method].apply(this, args);
                }
            });
            return newMethods;
        }

        /**
         * 重写set方法，新增只处理unshift
         */
        #set (target, property, value, receiver) {
            if (property === 'length') {
                // 修改length属性更新索引
                target.forEach((item, index) => {
                    item.index = index;
                });
                // 长度大于0，关闭文字区域
                value > 0 ? 
                    this.changeImageListInfo(false) : 
                    this.changeImageListInfo(true);
            }
            return Reflect.set(target, property, value, receiver);
        }

        /**
         * 重写get方法
         */
        #get (target, property, receiver) {
            return Reflect.get(target, property, receiver);
        }

        /**
         * 插入一个img节点
         * @param {{code:string,src:string,index:number,target?:HTMLElement}} data 图片数据
         * @param {boolean} head 是否从头部插入，默认为true
         * @returns 当前图片对应的哈希码
         */
        #addImageItem (data, head=true) {
            if (!data) return;
            const { src, code } = data;
            if (!src) return;
            // 外层容器
            let el = createELement('div', { class: listImageClass, [imageContainerCodeName]: code });
            // 图片本体
            el.appendChild(createELement('img', { class: imageClass, loading: 'lazy', src }));
            // 操作按钮
            let selectBut, deleteBut;
            el.appendChild(selectBut = createELement('span', { class: imageButtonClass }));
            el.appendChild(deleteBut = createELement('span', { class: imageButtonClass }));
            classListOperation(selectBut, 'add', imageSelectButtonClass, circleBackIconClass);
            classListOperation(deleteBut, 'add', imageDeleteButtonClass, deleteIconClass);
            // 事件绑定
            this.imageSelectIconEventBind(selectBut, false, data);
            this.imageDeleteIconEventBind(deleteBut, false, data);
            this.imageElementEventBind(el, false, data);
            // 插入元素
            this.insert.call(this, el, head);
            return el;
        }

        /**
         * 插入元素方法
         * @param {HTMLElement} el
         */
        insert (el, head) {
            if (this.element.childNodes.length === 0 || !head) {
                this.element.appendChild(el);
            } else {
                // 在开头插入元素
                this.element.insertBefore(el, this.element.firstChild);
            }
        }

        /**
         * 删除一个图片元素
         * @param {HTMLElement} target 
         */
        #deleteImageItem (target) {
            if (!target) return;
            // 添加删除类名动画
            classListOperation(target, 'add', imageDeleteCLass);
            const selectBut = target.querySelector(
                `.${imageButtonClass}.${imageSelectButtonClass}`
            );
            const deleteBut = target.querySelector(
                `.${imageButtonClass}.${imageDeleteButtonClass}`
            );
            // 解除事件绑定
            this.imageSelectIconEventBind(selectBut, true);
            this.imageDeleteIconEventBind(deleteBut, true);
            this.imageElementEventBind(target, true);
            setTimeout(() => {
                target.remove();
            }, 300);
        }

        /**
         * 对图片列表提示信息进行设置
         * @param {boolean} empty 
         * @param {boolean} loading 
         */
        changeImageListInfo (empty=true, loading=false) {
            if (loading !== this.imageInfoLoading) {
                this.imageInfoLoading = loading;
                // 加载状态不同，empty属性相同也可能有不同语句，需要重置状态
                this.imageInfoEmpty = undefined;
                let loadingTarget = $query(imageListInfoIcon);
                if (loading) {
                    // 添加动画
                    classListOperation(loadingTarget, 'add', loadingClass, imageListInfoShowClass);
                    setHtmlText(loadingTarget, 'html', iconCode.loadingSingle);
                } else {
                    classListOperation(loadingTarget, 'remove', loadingClass, imageListInfoShowClass);
                    setHtmlText(loadingTarget, 'html', '');
                }
            }
            if (empty !== this.imageInfoEmpty) {
                this.imageInfoEmpty = empty;
                let infoTarget = $query(imageListInfoContent);
                let containerTarget = getId(imageListInfoId);
                if (empty) {
                    // 数组为空，根据加载情况显示文字
                    classListOperation(containerTarget, 'add', imageListInfoShowClass)
                    setHtmlText(infoTarget, 'text', loading ? imageListInfoEmptyLoading : imageListInfoEmpty);
                } else {
                    // 数组不为空，隐藏文字区域
                    classListOperation(containerTarget, 'remove', imageListInfoShowClass);
                    setHtmlText(infoTarget, 'text', '');
                }
            }
        }

        /**
         * 检查是否有元素
         */
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
                classListOperation(item, 'remove', ImageSelectStateClass);
            });
        }

        /**
         * 取消冒泡
         * @param {HTMLElement} el 
         */
        stopPropagation (el, event='click') {
            if (el) {
                el.addEventListener(event,e => {
                    e.stopPropagation();
                });
            }
        }

        /**
         * 图片选中后的显示状态处理
         * @param {number|string} value 
         */
        imageClickHandle (value) {
            const { select, index } = this.hasSelect();
            if (select) 
                this.cancelSelect(index);
            if (typeof value === 'string') 
                value = this.isCodeContain(value);
            if (index === value) 
                return;
            let target = this.getChild()[value];
            classListOperation(target, 'add', selectClass);
        }

        /**
         * 删除指定位置的select类名
         * @param {Number} index 索引
         */
        cancelSelect (index) {
            if (index >= 0) {
                classListOperation(this.getChild()[index], 'remove', selectClass);
            }
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
                if (this.getCodeValue(list[i]) === code) {
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
         * 获取编码属性值
         * @param {HTMLElement} el 
         */
        getCodeValue (el) {
            if (el && objectHas(el.dataset, imageContainerCode)) {
                return el.dataset[imageContainerCode];
            }
            return undefined;
        }

        /**
         * 删除图标点击事件处理
         * @param {MouseEvent} e 
         * @returns 
         */
        deleteOneImageIcon (data=undefined, e) {
            e.stopPropagation();
            if (!canChange()) 
                return;
            // 通过哈希码删除
            if (objectHas(data, 'code')) 
                iconClickDeleteImage(data.code);
        }

        /**
         * 选择图标点击事件处理
         * @param {MouseEvent} e 
         * @returns 
         */
        selectOneImageIcon (data=undefined, e) {
            e.stopPropagation();
            if (!canChange()) 
                return;
            // 通过索引设置选中
            if (objectHas(data, 'index') && data.index >= 0) 
                this.toggleSelectStateToImageIcon(data.index);
        }

        /**
         * 绑定事件处理函数
         * @param {{target:HTMLElement}} param
         */
        imageClick (data=undefined, { target }) {
            if (!canChange()) 
                return;
            if (target.classList.contains(imageClass)) 
                target = target.parentElement;
            if (target.classList.contains(selectClass)) 
                return;
            // 通过哈希码和索引选择背景图
            if (objectHas(data, 'code', 'index'))
                settingBackground({
                    code: data.code,
                    index: data.index
                });
        }

        /**
         * 删除按钮事件绑定
         * @param {HTMLElement} el 
         */
        imageDeleteIconEventBind(el, remove=false, data=undefined) {
            if (!el) return;
            remove ? 
                el.removeEventListener('click', this.deleteOneImageIcon.bind(this)) : 
                el.addEventListener('click', this.deleteOneImageIcon.bind(this, data));
        }
        
        /**
         * 选择按钮事件绑定
         * @param {HTMLElement} el 
         */
        imageSelectIconEventBind(el, remove=false, data=undefined) {
            if (!el) return;
            remove ? 
                el.removeEventListener('click', this.selectOneImageIcon.bind(this)) : 
                el.addEventListener('click', this.selectOneImageIcon.bind(this, data));
        }

        /**
         * 绑定图片点击事件
         * @param {HTMLElement} el 
        */
        imageElementEventBind (el, remove=false, data=undefined) {
            if (!el) return;
            remove ? 
                el.removeEventListener('click', this.imageClick.bind(this)) : 
                el.addEventListener('click', this.imageClick.bind(this, data));
        }
    }

    return new ImageList();
}