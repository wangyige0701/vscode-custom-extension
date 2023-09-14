
export type ImageCodes = {
    path: string;
    value: string[];
};

export type Res = (value?: any | PromiseLike<any>) => void;

export type Rej = (reason?: any) => void;

export type SetCodesQueue = {
    func: () => Promise<any>;
    resolve?: Res;
    reject?: Rej;
};