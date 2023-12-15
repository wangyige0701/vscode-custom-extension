import { curry } from "@/utils";
import { selectFile } from "../components/file";

function selectFileExpand (files: boolean, folders: boolean, title: string) {
    return selectFile({
        files,
        folders,
        title
    });
}

/** 只选择文件 */
export const selectFileOnly  = curry(selectFileExpand, true, false);

/** 只选择文件夹 */
export const selectFolderOnly = curry(selectFileExpand, false, true);
