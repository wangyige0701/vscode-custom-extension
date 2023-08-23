/* index(0) */

/** 需要的文本、选择器名称等数据 */
const queryNames = {
    /** 选择图片的按钮id */
    selectButtonId: 'selectImage',
    /** 选择本地图片文本 */
    selectButtonText: '选择本地图片',
    /** 选择文件按钮中的加载图标容器类名 */
    selectButtonLoadingClass: 'iconfont',
    /** 删除或批量设置按钮容器类名 */
    batchButtonContainerClass: 'batch-operation',
    /** 批量删除按钮id */
    batchDeleteId: 'batchDelete',
    /** 背景图随机设置按钮id */
    randomBackId: 'randomBack',
    /** 全部选中按钮id */
    selectAllId: 'selectAll',
    /** 取消选中按钮id */
    selectCancelId: 'selectCancel',
    /** 随即切换（全部）文本 */
    rendomAllBack: '随机切换（全部）',
    /** 随机切换（选中）文本 */
    rendomSelectBack: '随机切换（选中）',
    /** 关闭随机切换文本 */
    closeRandom: '关闭随机切换',
    /** 按钮显示加载图标的类名 */
    judgeLoading: 'isloading',
    /** 图标无限旋转的动画类名 */
    loadingClass: 'loading-rotate',
    /** 图片列表区域id */
    listId: 'list',
    /** 图片列表类名 */
    listImageClass: 'image-container',
    /** 在dataset中的存放图片哈希码的属性名，以及部分id前缀 */
    imageContainerCode: 'code',
    /** 图片中用于存放图片哈希码的dataset属性名 */
    imageContainerCodeName: 'data-code',
    /** 图片公用类名 */
    imageClass: 'image',
    /** 图片选中的类名 */
    selectClass: 'select',
    /** 图片被选为随机设置的类名 */
    imageIsRandomClass: 'random',
    /** 左上角图标选中时图片容器的类名 */
    selectButtonToContainerClass: 'container-icon-select',
    /** 图片操作按钮的类名 */
    imageButtonClass: 'image-operation',
    /** 图片选中按钮的类名 */
    imageSelectButtonClass: 'image-select',
    /** 图片删除按钮的类名 */
    imageDeleteButtonClass: 'image-delete',
    /** 圆形背景填充图标类名 */
    circleBackIconClass: 'icon-circle-background',
    /** 删除图标的类名 */
    deleteIconClass: 'icon-delete',
    /** 图片左上角图标选中类名 */
    ImageSelectStateClass: 'select',
    /** 图片列表展示文字提示区域容器 */
    imageListInfoId: 'imageListInfo',
    /** 图片列表文字提示区域图标的选择器字符串 */
    imageListInfoIcon: '.image-list-info>.iconfont',
    /** 图片列表提示区域文字容器的选择器字符串 */
    imageListInfoContent: '.image-list-info>.info-content',
    /** 显示文字提示类名 */
    imageListInfoShowClass: 'show',
    /** 暂无背景图数据，请上传 */
    imageListInfoEmpty: '暂无背景图数据，请上传',
    /** 背景图数据加载中 */
    imageListInfoEmptyLoading: '背景图数据加载中',
    /** 图片加载删除动画时间 */
    imageAnimationTime: 500,
    /** 图片删除时的类名 */
    imageDeleteClass: 'image-delete',
    /** 删除复数图片时的类名 */
    imageDeletMultipleClass: 'multiple-images-delete',
    /** 删除复数图片时的滚动动画类名 */
    imageDeletMultipleScrollClass: 'multiple-images-delete-scroll',
};