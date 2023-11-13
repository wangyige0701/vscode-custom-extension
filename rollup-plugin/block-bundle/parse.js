// 解析参数
const rules = require('./utils/rules');
const Random = require('../utils/folder-create');

const random = new Random();

const matchVariables = /\{([\d\w]+)\}/g;

/**
 * 注册一条规则
 */
class Regist {
    static instance;

    /** @type {{[key: string]: Map<string, { from: {same:(path:string)=>{state:boolean,{variables: [key: string]:string}}}, to: string }}} */
    data = {};

    constructor () {
        if (Regist.instance) {
            return instance;
        }
        Regist.instance = this;
    }

    /**
     * @param {{from: string, to: string}} options
     * @param {'worker'|'package'} type
     */
    add (options, type) {
        if (!(type in this.data)) {
            this.data[type] = new Map();
        }
        const target = this.data[type];
        const { from, to } = options;
        if (!target.has(from)) {
            target.set(from, {
                from: rules(from),
                to
            });
        }
    }

    /**
     * 传入实际路径判断是否在已经注册的规则中，如果是，返回最终打包路径
     * @param {string} path
     * @param {'worker'|'package'} type
     */
    is (path, type) {
        if (type in this.data) {
            const target = this.data[type];
            const keys = target.keys();
            for (const key of keys) {
                const mapValue = target.get(key);
                const result = mapValue.from.same(path);
                if (result.state) {
                    // 此处表明传入路径匹配到了对应规则
                    const str = mapValue.to.replace(matchVariables, (_, target) => result.variables[target]);
                    console.log(str);
                    return str;
                }
            }
        }
    }
}

module.exports = Regist;