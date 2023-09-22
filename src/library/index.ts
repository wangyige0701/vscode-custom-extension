
/** 储存清空对象的方法 */
class ReportRequire {
    static store: Map<string, Function>;

    /** 插入一个清除函数 */
    static set (name: string, callback: Function) {
        if (!ReportRequire.store) {
            ReportRequire.store = new Map<string, Function>();
        }
        ReportRequire.store.set(name, callback);
    }

    /** 执行一个导入对象的清除函数 */
    static execute (name: string) {
        if (ReportRequire.store.has(name)) {
            ReportRequire.store.get(name)?.();
            ReportRequire.store.delete(name);
        }
    }
    
    /** 执行所有导入对象的清除函数 */
    static clear () {
        if (!ReportRequire.store) {
            return;
        }
        ReportRequire.store.forEach((val, key) => {
            ReportRequire.execute(key);
        });
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