// 解析参数
const path = require('path');
const pathParse = require('./path');

/**
 * 解析路径规则，*：任意一个目录或任意一个文件，**：任意目录包括文件，!：只包含对应目录名或文件名
 * @param {string} str
 */
function rules (str) {
    str = path.resolve(str);
    const result = str.split('\\');
    return {
        /** @param {string[]} target */
        same (target) {
            let i = 0, l = 0;
            let flag = false;
            while (i < target.length) {
                if (l >= result.length) {
                    flag = false;
                    break;
                }
                const t = target[i], r = result[l];
                if (t === r && r !== '*' && r !== '**' && !r.startsWith('!')) {
                    flag = true;
                    l++;
                } else if (r === '*') {
                    flag = true;
                    l++;
                } else if (r === '**') {
                    flag = true;
                    if (t === result[l + 1]) {
                        l+=2, i++;
                        continue;
                    }
                } else if (r.startsWith('!')) {
                    const search = r.slice(1).split(',');
                    if (search.includes(t)) {
                        flag = true;
                        l++;
                    } else {
                        flag = false;
                        break;
                    }
                } else {
                    flag = false;
                    break;
                }
                i++;
            }
            return flag;
        }
    };
}

function parseArgs(args) {
    // rules
}

// const rele = rules('src/test/**/*');
// const compare = path.resolve('src/test/file/file3/a.js');
// console.log(rele.same(pathParse(compare).pathItem));

module.exports = parseArgs;