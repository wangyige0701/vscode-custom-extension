/** 校验和数据的状态 */
export class ChecksumsState {
    /** 是否允许修改校验和 */
    static canChangeChecksums = false;

    /** 是否初始化 */
    static init = false;

    /** 更改能否修改校验和状态 */
    static change (state: boolean  = true) {
        this.canChangeChecksums = state;
        return this;
    }

    /** 获取是否允许修改校验和状态 */
    static get canChange () {
        return this.canChangeChecksums;
    }

    /** 修改初始化状态 */
    static initial () {
        this.init = true;
    }

    /** 是否已经初始化 */
    static get isInitial () {
        return this.init;
    }
}