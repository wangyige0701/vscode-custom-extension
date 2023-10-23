import sharp from "../../library/importer/sharp";
import type { CompressStyle, InputType } from "./types";
import { $rej } from "../../error";
import { isString } from "..";


/**
 * 压缩图片，将图片数据压缩为webp格式图片
 * @param input Buffer数据，如果传string一定要是base64数据
 */
export function imageCompression (input: InputType, style: CompressStyle = { quality: 100, size: 300 }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        // 对sharp模块进行处理，对应模块出错则直接抛出
        let sharpCreate: Promise<Buffer>;
        try {
            sharpCreate = sharp(checkInput(input)).resize(style.size).webp({ quality: style.quality }).toBuffer();
        } catch (error) {
            return reject($rej(error, imageCompression.name));
        }
        if (!sharpCreate) {
            return reject($rej('Import Error', imageCompression.name));
        }
        sharpCreate.then(buffer => {
            resolve(buffer);
        }).catch(err => {
            reject($rej(err, imageCompression.name));
        }); 
    });
}

/**
 * 如果是字符串，默认是base64，将其转为Buffer
 */
function checkInput (input: InputType) {
    if (isString(input) && input.startsWith('data:')) {
        return Buffer.from(input.split('base64,')[1], 'base64');
    }
    return input;
}