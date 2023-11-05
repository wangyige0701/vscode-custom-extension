import type { Sharp, SharpOptions } from "sharp";
import { dynamicImportFunction } from "..";

/** sharp构造函数类型 */
type $Sharp = ((options?: SharpOptions) => Sharp) | 
((
    input?:
        | Buffer
        | ArrayBuffer
        | Uint8Array
        | Uint8ClampedArray
        | Int8Array
        | Uint16Array
        | Int16Array
        | Uint32Array
        | Int32Array
        | Float32Array
        | Float64Array
        | string,
    options?: SharpOptions,
) => Sharp);

/** sharp动态实例 */
const sharp = dynamicImportFunction<$Sharp>("sharp", () => require("sharp"));

export default sharp;