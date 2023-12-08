import type { CancellationToken, Progress, ProgressLocation } from "vscode";

export type ProgressLocationData = keyof typeof ProgressLocation;

/**
 * 进度条数据类型
*/
export interface ProgressOptionsNew {
    location: ProgressLocationData | { viewId: string } | ProgressLocation;
    title?: string;
    cancellable?: boolean;
}

export type ProgressTaskType<R> = (progress: Progress<{ message?: string; increment?: number }>, token: CancellationToken) => Thenable<R>