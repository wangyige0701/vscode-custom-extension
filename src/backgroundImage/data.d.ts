

export type backgroundMessageData = backgroundInitType | selectImageType | deleteImageType | settingBackgroundType;

interface dataType {
    name: string;
    value: any;
}

interface backgroundInitType extends dataType {
    backgroundInit: boolean
}

interface selectImageType extends dataType {
    selectImage: boolean
}

interface deleteImageType extends dataType {
    deleteImage: string
}

interface settingBackgroundType extends dataType {
    settingBackground: {
        code: string,
        target: HTMLLIElement
    }
}