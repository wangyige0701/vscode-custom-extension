
/** 网络图片路径正则 */
export const imageUrl = /^(https?)\:\/\/[\S]+\.(gif|png|jpg|jpeg|webp)(?:\?(?:(?:[.]+)=(?:[.]+))?){0,1}$/;

/** 网络路径正则，解析url可以使用{@linkcode URL} */
export const networkUrl = /^(https|http)\:\/\/([\S]+)\.([^\?\s]+)(?:\?(.*))?$/;