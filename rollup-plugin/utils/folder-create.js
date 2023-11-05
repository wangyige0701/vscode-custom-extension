
/**
 * 根据文件夹路径生成随机字符
 */
class Random {
    /** @type {{code:string;path:string;}[]} */
    static folderNames = [];

    /** @returns {string} */
    static create (len = 6) {
        const r = Math.random().toString(36).slice(2, len + 2).padEnd(len, '0');
        if (this.folderNames.find(item =>item.code === r)) {
            return this.create(len);
        }
        return r;
    }

    static set (patName) {
        const item = this.folderNames.find(item => item.path === patName);
        if (item) {
            return item.code;
        }
        const r = this.create();
        this.folderNames.push({ code: r, path: patName });
        return r;
    }

    static get get () {
        return this.folderNames;
    }
}

module.exports = Random;