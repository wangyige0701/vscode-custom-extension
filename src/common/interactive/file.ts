import { Uri, window } from "vscode";
import { dirname } from "path";
import { isString } from "../index";
import type { SelectFileParams } from "./types";

/**
 * 选择文件
 * @param param 
 */
export function selectFile ({
    files = true,
    folders = false,
    many = false,
    filters = void 0,
    title = '选择文件',
    openLabel = '确认',
    defaultUri
}: SelectFileParams): Promise<{uri:Uri[], file:boolean, dirName:string}> {
    return new Promise((resolve, reject) => {
        if (files && folders) {
            folders = false;
        }
        if (!files && !folders) {
            files = true;
        }
        if (folders && many) {
            many = false;
        }
        if (folders && filters) {
            filters = void 0;
        }
        if (isString(defaultUri) && defaultUri.length > 0) {
            defaultUri = Uri.file(defaultUri);
        } else {
            defaultUri = void 0;
        }
        Promise.resolve(
            window.showOpenDialog({
                defaultUri: defaultUri as Uri | undefined,
                canSelectFiles: files,
                canSelectFolders: folders,
                canSelectMany: many,
                filters,
                title,
                openLabel
            })
        ).then(res => {
            if (res) {
                let dirName;
                if (files) {
                    dirName = dirname(res[0].fsPath);
                } else {
                    dirName = res[0].path;
                }
                return resolve({ uri: res, file: files, dirName });
            }
            reject();
        }).catch(err => {
            reject(new Error('ShowOpenDialog Error', { cause: err }));     
        });
    });
}