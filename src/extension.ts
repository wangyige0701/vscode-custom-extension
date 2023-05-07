import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	const start = vscode.commands.registerCommand('wangyige.start', () => {
		vscode.window.showInformationMessage('Hello World from WangYige!!!!!!');
	});

	context.subscriptions.push(start);
}

// This method is called when your extension is deactivated
export function deactivate() {}