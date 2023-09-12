import path from 'path';
import fs from 'fs';
import { createHash } from "crypto";

const base = process.cwd();

/** 文件路径 */
const cssName = 'workbench.desktop.main.css';
/** 写背景图样式的外部css文件名 */
const externalFileName = 'backgroundImageInfo.css';
/** 校验和文件名 */
const checksumsFileName = 'product.json';

/** css文件根路径 */
const cssRoot = path.join(base, 'resources', 'app', 'out', 'vs', 'workbench');

const sourceFilePath = path.join(cssRoot, cssName);
const exteranlFilePath = path.join(cssRoot, externalFileName);

/** 校验和文件路径 */
const checksumsRoot = path.join(base, 'resources', 'app');

const checksumsFilePath = path.join(checksumsRoot, checksumsFileName);

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

/** 捕获校验和数据位置 */
const getChecksumsPositionRegexp = /^([\w\W]*"checksums"\s*:\s*\{)([^\{\}]*)(\}[\w\W]*)$/;

/** 依次获取校验和所有数据 */
const getChecksumsDataRegexp = /(?:"(.*)"\s*:\s*"(.*)")/g;

/** 计算校验和 */
function computeChecksums (content: string) {
    return createHash('md5').update(content).digest('base64').replace(/=+$/, '');
}

/** 清除配置 */
function uninstall () {
    try {
        let cssContent: string = '';
        if (fs.existsSync(sourceFilePath)) {
            // 读取文件
            cssContent = fs.readFileSync(sourceFilePath).toString();
            if (findSourceCssPositionRegexp.test(cssContent)) {
                // 删除配置
                cssContent = cssContent.replace(findSourceCssPositionRegexp, "");
                // 重置文件
                fs.writeFileSync(sourceFilePath, Buffer.from(cssContent));
            }
        }
        // 清除写图片数据的文件
        if (fs.existsSync(exteranlFilePath)) {
            fs.unlinkSync(exteranlFilePath);
        }
        if (cssContent && fs.existsSync(checksumsFilePath)) {
            // 读取校验和文件
            let checkContent = fs.readFileSync(checksumsFilePath).toString();
            // 校验和匹配结果
            const checksumsData = checkContent.match(getChecksumsPositionRegexp);
            if (checksumsData) {
                // 具体校验和数据
                const checksumsValue = checksumsData[2].matchAll(getChecksumsDataRegexp);
                if (checksumsValue) {
                    // 匹配css文件数据
                    const searchDatas = [...checksumsValue];
                    const search = searchDatas.find(item => item[1].endsWith(cssName));
                    if (search) {
                        // 计算校验和
                        const checksum = computeChecksums(cssContent);
                        if (checksum !== search[2]) {
                            // 校验和不相等更新
                            checkContent = checkContent.replace(
                                new RegExp(`(^[\\w\\W]*"${search[1]}"\\s*:\\s*")([^"]*)("[\\w\\W]*$)`), 
                                (_, $1, $2, $3) => `${$1}${checksum}${$3}`
                            );
                            // 重置校验和数据
                            fs.writeFileSync(checksumsFilePath, Buffer.from(checkContent));
                        }
                    }
                }
            }
        }
    } catch (error) {
        throw error;
    }
}

uninstall();