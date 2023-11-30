
/** 网络图片路径正则 */
export const imageUrl = /^(https?)\:\/\/[\S]+\.(gif|png|jpg|jpeg|webp)(?:\?(?:(?:[.]+)=(?:[.]+))?){0,1}$/;

/** 网络路径正则，解析url可以使用{@linkcode URL} */
export const networkUrl = /^(https|http)\:\/\/([\S]+)\.([^\?\s]+)(?:\?(.*))?$/;

/** 任意空格 */
export const anySpace = '\\s\*';

/** 任意字符 */
export const anyCharacter = '\[\\s\\S\]\*';

/** 任意字符不包括空格 */
export const anyCharacterWithoutSpace = '\\S\*';

/** 任意字符不包括换行 */
export const anyCharacterWithoutWrap = '\.\*';

/** 非空格开头非空格结尾，中间允许有空格，必须以非空格结尾 */
export const sideNoSpace = '\\S\*\.\*\\S\{1\,\}';

/** 任意数字 */
export const anyNumber = '\\d\*';

/** 任意单词 */
export const anyWord = '\\w\*';

/** 任意单词和数字 */
export const anyWordAndNumber = '[\\d\\w]\*';

/**
 * 将字符串转为正则
 */
export function strToReg (str: string): RegExp {
    return new RegExp(str);
}