
/** 储存清空对象的方法 */
class ReportRequire {
    static autoClearTime = 1000 * 60 * 5;
    static store: Map<string, Function>;
    static timeout: { [key: string]: NodeJS.Timeout };

    /** 插入一个清除函数 */
    static set (name: string, callback: Function) {
        if (!this.store) {
            this.store = new Map<string, Function>();
        }
        if (!this.timeout) {
            this.timeout = {};
        }
        if (this.timeout[name]) {
            clearTimeout(this.timeout[name]);
        }
        this.store.set(name, callback);
        // 自动清除实例缓存
        this.timeout[name] = setTimeout(() => {
            this.execute(name);
        }, this.autoClearTime);
    }

    /** 执行一个导入对象的清除函数 */
    static execute (name: string) {
        if (this.store.has(name)) {
            this.store.get(name)?.();
            this.store.delete(name);
        }
    }
    
    /** 执行所有导入对象的清除函数 */
    static clear () {
        // 当未执行任何获取模块对象数据的函数时，store属性是undefined
        if (!this.store || this.store.size <= 0) {
            return;
        }
        this.store.forEach((val, key) => {
            this.execute(key);
        });
        (this.store as unknown) = null;
        (this.timeout as unknown) = null;
    }
}

/** 动态导入对象模块 */
export function dynamicImportObject<T> (name: string, requireFunc: () => T): T {
    if (typeof requireFunc !== 'function') {
        throw new Error("Illegal Param");
    }
    const symbolName = Symbol(name);
    const target = new Proxy<any>({
        [symbolName]: null
    }, {
        get (target, property, receiver) {
            if (!target[symbolName]) {
                target[symbolName] = requireFunc();
                ReportRequire.set(name, () => target[symbolName] = null);
            }
            return target[symbolName][property]??void 0;
        }
    }) as T;
    return target;
}

/** 动态导入函数模块 */
export function dynamicImportFunction<T> (name: string, requireFunc: () => T): T {
    if (typeof requireFunc !== 'function') {
        throw new Error("Illegal Param");
    }
    const symbolName = Symbol(name);
    const record: {[key: symbol]: Function | null} = {
        [symbolName]: null
    };
    return (function (...params: any[]) {
        if (!record[symbolName]) {
            record[symbolName] = requireFunc() as Function;
            ReportRequire.set(name, () => record[symbolName] = null);
        }
        return record[symbolName](...params);
    } as T);
}

/** 动态导入对象清空 */
export function clearDynamicImport () {
    ReportRequire.clear();
}