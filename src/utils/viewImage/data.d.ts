
interface dataType {
    group?:string;
    name: string;
    value?: any;
}

export type viewImageSendMessage = changeImageType | destroyType;

interface changeImageType extends dataType {
    name: 'changeImage',
    value: string
}

interface destroyType extends dataType {
    name: 'destroy'
}