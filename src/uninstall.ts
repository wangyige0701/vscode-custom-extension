import path from 'path';
import fs from 'fs';

const base = process.cwd();
// 文件路径
const cssName = 'workbench.desktop.main.css';
/** 写背景图样式的外部css文件名 */
const externalFileName = 'backgroundImageInfo.css';
/** 根路径 */
const root = path.join(base, 'resources', 'app', 'out', 'vs', 'workbench');

const sourceFilePath = path.join(root, cssName);
const exteranlFilePath = path.join(root, externalFileName);

/** 标签名正则 */
const tagNameReg = 'wangyige\\.background';

/** 任意字符 */
const a = '\[\\s\\S\]\*'; 

/** 匹配开始标签正则 */
const importStartMatch = `\\/\\*\\s\*${tagNameReg}\\.start\\s\*\\*\\/`; 
/** 匹配结束标签正则 */
const importEndMatch = `\\/\\*\\s\*${tagNameReg}\\.end\\s\*\\*\\/`; 

/** 匹配源及外部css文件修改内容标签范围正则字符串，捕获标签中的内容 */
const findSourceCssPosition = `${importStartMatch}(${a})${importEndMatch}`;
/** 匹配源及外部css文件修改内容标签范围，捕获标签中的内容的正则对象 */
const findSourceCssPositionRegexp = new RegExp(findSourceCssPosition);

/** 清除配置 */
async function uninstall () {
    try {
        // 读取文件
        let content = fs.readFileSync(sourceFilePath).toString();
        // 删除配置
        content = content.replace(findSourceCssPositionRegexp, "");
        // 重置文件
        fs.writeFileSync(sourceFilePath, Buffer.from(content));
        // 清除写图片数据的文件
        if (fs.existsSync(exteranlFilePath)) {
            fs.unlinkSync(exteranlFilePath);
        }
    } catch (error) {
        throw new Error(error);
    }
}

uninstall();