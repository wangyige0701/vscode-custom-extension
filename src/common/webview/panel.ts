import type { WebviewOptions, WebviewPanel, WebviewPanelOptions } from 'vscode';
import { ViewColumn, window } from 'vscode';
import { errlog } from '@/error';
import { FileMerge, messageHandle } from "./create";

/**
 * 注册panel类型webview页面
 * @param viewType webview面板标识
 * @param provider.path 创建的webview页面文件引用路径，默认路径是当前扩展的根路径
 * @param provider.title webview面板的标题文本
 * @param viewColumn 在编辑器中显示的面板位置索引
 * @param options webview页面的设置，默认是允许脚本插入
 * */
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
