import { ViewColumn, WebviewOptions, WebviewPanel, WebviewPanelOptions, window } from 'vscode';
import { FileMerge } from ".";
import { errlog } from '../../error';
import { messageHandle } from './message';

/** 注册panel类型webview页面 */
export function registerWebviewPanel (
    viewType: string, 
    provider: { path: string, title: string }, 
    viewColumn: ViewColumn = ViewColumn.One,
    options: WebviewPanelOptions & WebviewOptions = { enableScripts: true }
): WebviewPanel {
    let newFile: FileMerge | null = new FileMerge(provider.path);
    const panel = window.createWebviewPanel(viewType, provider.title, viewColumn, options);
    // 生成html文本
    newFile.setHtml(panel.webview).then(html => {
        panel.webview.html = html;
    }).catch(err => {
        errlog(err);
    }).finally(() => {
        newFile = null;
    });
    // 通信数据接收处理
    messageHandle(panel.webview);
    return panel;
}
