import { joinPathUri } from "src/utils/file";
import { contextContainer } from "src/utils/webview";
import { Uri } from "vscode";

/**
 * 获取储存背景图资源的uri
 * @returns {Uri|undefined}
 */
export function imageStoreUri (): Uri | undefined {
    const uri = contextContainer.instance?.extensionUri;
    if (uri) {
        return joinPathUri(uri, 'resources', 'background');
    } else {
        return;
    }
}