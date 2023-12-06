/** @fileoverview  */

import type { CodeRefreshType, CodeChangeType } from "../../../@types";
import { imageDataRepository as repository } from "../data";

/**
 * 对哈希码数据缓存数组进行更新操作
 * @param code 
 * @param state 
 */
export function codeListRefresh(code: string, state: 'check', options: CodeRefreshType): Promise<{ code: string; exist: boolean; }>;
export function codeListRefresh(code: string, state: 'add' | 'delete', options: CodeRefreshType): Promise<string>;
export function codeListRefresh (
    code: string, 
    state: CodeChangeType,
    { addData = void 0, compressData = void 0, uri = void 0 }: CodeRefreshType
) {
    if (state === 'add') {
        return repository.codeAdd(code, addData!, compressData!);
    } else if (state === 'delete') {
        return repository.codeDelete(code);
    } else if (state === 'check') {
        return repository.codeCheck(code, addData!, uri!);
    } else {
        return Promise.resolve(code);
    }
}