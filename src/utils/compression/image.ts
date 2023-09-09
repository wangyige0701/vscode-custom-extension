import sharp from "sharp";
import type { CompressStyle, InputType } from "./type";
import { promiseReject } from "../../error";
import { isString } from "..";


/**
 * 压缩图片，将图片数据压缩为webp格式图片
 * @param input Buffer数据，如果传string一定要是base64数据
 */
export function imageCompression (input: InputType, style: CompressStyle = { quality: 100, size: 300 }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        sharp(checkInput(input)).resize(style.size).webp({ quality: style.quality }).toBuffer().then(buffer => {
            resolve(buffer);
        }).catch(err => {
            reject(promiseReject(err, imageCompression.name));
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