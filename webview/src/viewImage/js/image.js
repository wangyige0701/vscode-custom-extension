/* index(2) */

const mouseMove = {
    isMouseDown: false,
    oldx: 0,
    oldy: 0,
    recordx: 0,
    recordy: 0
};

/** @param {HTMLElement} el */
function changeCss (el) {
    el.style.transform = `matrix3d(
        ${operationTarge.scale}, 0, 0, 0, 
        0, ${operationTarge.scale}, 0, 0, 
        0, 0, 1, 0,
        ${operationTarge.left}, ${operationTarge.top}, 0, 1
    )`;
}

/**
 * 绑定鼠标事件
 * @param {HTMLElement} el 
 */
function bindMouseOperation (el) {
    if (!el) {
        return;
    }
    document.body.addEventListener('wheel', scale.bind(this, el));
    el.addEventListener('mousedown', mousedown);
}

/**
 * 结束鼠标事件绑定
 * @param {HTMLElement} el 
 */
function unbindMouseOperation (el) {
    if (!el) {
        return;
    }
    document.body.removeEventListener('wheel', scale);
    el.removeEventListener('mousedown', mousedown);
}

/**
 * 鼠标滚轮控制图片缩放
 * @param {WheelEvent} e 
 */
function scale (el, { deltaY } = e) {
    if (!operationTarge.can) {
        return;
    }
    if (deltaY < 0 && operationTarge.scale < operationTarge.maxScale) {
        // 向上滚动
        operationTarge.scale += operationTarge.scaleFactor;
    } else if (deltaY > 0 && operationTarge.scale > operationTarge.minScale) {
        operationTarge.scale -= operationTarge.scaleFactor;
    }
    changeCss(el);
}

/**
 * @param {MouseEvent} e
*/
function mousedown ({ clientX, clientY }) {
    mouseMove.isMouseDown = true;
    mouseMove.oldx = clientX;
    mouseMove.oldy = clientY;
    mouseMove.recordx = operationTarge.left;
    mouseMove.recordy = operationTarge.top;
    window.addEventListener('mousemove', mousemove);
    window.addEventListener('mouseup', mouseup);
    window.addEventListener('mouseout', mouseup);
}

/**
 * @param {MouseEvent} e
*/
function mousemove ({ clientX, clientY }) {
    if (!mouseMove.isMouseDown || !operationTarge.can) {
        return;
    }
    const el = document.getElementById(imageContainerId),
    rate = (operationTarge.scale - 1) / 2,
    min_top = operationTarge.minTop,
    max_top = operationTarge.maxTop,
    min_left = operationTarge.minLeft,
    max_left = operationTarge.maxLeft,
    newy = mouseMove.recordy + clientY - mouseMove.oldy, 
    newx = mouseMove.recordx + clientX - mouseMove.oldx;
    // 无论缩放比例，推拽极限相同
    if (newy > (min_top - (rate * image_height)) && newy < (max_top + (rate * image_height))) {
        operationTarge.top = newy;
    }
    if (newx > (min_left - (rate * image_width)) && newx < (max_left + (rate * image_width))) {
        operationTarge.left = newx;
    }
    changeCss(el);
}

/**
 * 状态重置
 */
function mouseup () {
    mouseMove.isMouseDown = false;
    window.removeEventListener('mousemove', mousemove);
    window.removeEventListener('mouseup', mouseup);
    window.removeEventListener('mouseout', mouseup);
}

/**
 * 
 * @param {HTMLElement} target 
 * @param {{[key: string]: string}} params 
 * @returns 
 */
function setAllCss (target, params) {
    if (!params) {
        return;
    }
    for (let key in params) {
        if (!params[key]) {
            continue;
        }
        target.style[key] = params[key];
    }
}