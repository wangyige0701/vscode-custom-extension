





/**
 * 对哈希码数据缓存数组进行更新操作
 * @param code 
 * @param state 
 */
export function codeListRefresh(code: string, state: 'check', options: CodeRefreshType): Promise<{ code: string; exist: boolean; }>;
export function codeListRefresh(code: string, state: 'add' | 'delete', options: CodeRefreshType): Promise<string>;
export function codeListRefresh (
    code: string, 
    state: codeChangeType,
    { addData = void 0, compressData = void 0, uri = void 0 }: CodeRefreshType
): Promise<string | { code: string, exist: boolean }> {
    if (state === 'add') {
        return codeAdd(code, addData!, compressData!);
    } else if (state === 'delete') {
        return codeDelete(code);
    } else if (state === 'check') {
        return codeCheck(code, addData!, uri!);
    } else {
        return Promise.resolve(code);
    }
}