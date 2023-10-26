import type { QuickInputButton, QuickInputButtons, Uri } from "vscode";

class MyButton implements QuickInputButton {
    constructor(public iconPath: QuickInputButton["iconPath"], public tooltip: QuickInputButton["tooltip"]) { }
}

export function createQuickButton (icon: QuickInputButton["iconPath"], tooltip: QuickInputButton["tooltip"]) {
    const button = new MyButton(icon, tooltip);
};