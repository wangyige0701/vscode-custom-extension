import { Uri, Webview } from "vscode";
import { MessageSend } from "../main";
import { getHashCode } from "../..";
import { contextContainer } from "..";
import { imageToBase64, joinPathUri } from "../../file";
import { getBackgroundConfiguration } from "../../../workspace/background";
import { selectFile } from "../../interactive";

const imageFilters = { 'Images': ['png', 'jpg', 'jpeg', 'gif', 'webp'] };

/**
 * 获取储存背景图资源的uri
 * @returns 
 */
export function imageStoreUri (): Uri | undefined {
    const uri = contextContainer.instance?.extensionUri;
    if (uri) {
        return joinPathUri(uri, 'resources', 'background');
    } else {
        return;
    }
}

/**
 * 侧栏选择背景图
 * @param messageSend 
 * @param webview 
 */
export function selectImage (messageSend: MessageSend, webview: Webview) {
    selectFile({
        many: true,
        files: true,
        filters: imageFilters
    }).then(({ uri }) => {
        return imageToBase64(uri[0].fsPath);
    }).then(base64 => {
        const hashCode = getHashCode();
        messageSend(webview, {
            type: 'newImage',
            value: [base64, hashCode]
        });
    }).catch(err => {
        return new Error(err);
    });
}

/**
 * 创建文件储存图片文件
 */
function createFileStore () {
    const uri = imageStoreUri();
    if (!uri) return;
    const code = getHashCode();
}