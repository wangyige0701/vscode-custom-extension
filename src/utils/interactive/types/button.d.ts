import { QuickInputButton } from "vscode";

export type MyButtonType = {
    id: string;
    iconPath: QuickInputButton["iconPath"]; 
    tooltip: QuickInputButton["tooltip"];
}

export type ButtonIcon = QuickInputButton["iconPath"] | {
    id: string;
    color?: string;
};