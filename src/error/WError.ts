import type { ErrorOptions, ErrorPosition } from "./@types";
import { isString, splitByUpperCaseAndJoinWithSpaceUp } from "@/utils";
import { color } from "./print";

type Message = Array<string | { color: string; noColor: string }>;

/**
 * 自定义错误输出类型，只输出指定的错误信息和追踪栈内第一个追踪函数的信息
 * @param message 主要消息
 * @param options.position 错误的发生位置，类、函数或者参数错误
 * @param options.ClassName 类发生错误时的类名
 * @param options.FunctionName 函数发生错误时的函数名
 * @param options.ParameterName 参数发生错误时的参数名
 * @param options.description 对错误的具体描述
 */
export default class WError extends Error {
    private nameColor: string;
    private messageList: Message = [];

    constructor (message: string, options: ErrorOptions = {}) {
        super(message);
        if (message) {
            this.messageList.push(message);
        }

        // 错误类型
        this.name = `VSCode Extension Error [${PACKAGE_NAME}]`;
        this.nameColor = `${color('red', 'VSCode Extension Error')} [${color('yellow', PACKAGE_NAME)}]`;

        /** 用于记录换行数 */
        let wrap = 1;

        let position:ErrorPosition|undefined = void 0;
        let ClassName:string|undefined = void 0;
        let FunctionName:string|undefined = void 0;
        let ParameterName:string|undefined = void 0;

        // 错误详细信息
        this.has(options, 'position') ? position = options.position : void 0;
        this.has(options, 'ClassName') ? ClassName = options.ClassName : void 0;
        this.has(options, 'FunctionName') ? FunctionName = options.FunctionName : void 0;
        this.has(options, 'ParameterName') ? ParameterName = options.ParameterName : void 0;

        wrap += this.checkPosition({position, ClassName, FunctionName, ParameterName});

        // 错误描述
        if (this.has(options, 'description')) {
            if (this.messageList.length > 0) {
                this.messageList.push('\n');
                wrap++;
            }
            this.messageList.push('description: ' + options.description);
        }

        // 获取栈信息，并输出第一个文件
        if (this.stack) {
            let file = this.stack.split('\n').splice(wrap, 1)[0];
            if (file) {
                this.messageList.push({
                    color: `\n ${color('blue', '>> In File:')} ${file}\n`,
                    noColor: `\n >> In File ${file}\n`
                });
            }
            this.stack = void 0;
        }

        // 获取具体原因并输出
        if (this.has(options, 'cause')) {
            this.messageList.push(...this.causeHandle(options.cause));
        }
    }

    toString (color: boolean = false) {
        return (color ? this.nameColor : this.name) + '\n' + this.toColorString(color);
    }

    toColorString (color: boolean = false) {
        return this.messageList.reduce((prev, curr) => {
            return prev + (isString(curr) ? curr : color ? curr.color : curr.noColor);
        }, '');
    }

    /** cause数据处理 */
    causeHandle (cause: any): Message {
        let msg: Message = [];
        msg.push('------------------------------------\n');
        if (isString(cause)) {
            msg.push(cause);
        } else if (this.has(cause, 'stack')) {
            msg.push(cause.stack);
        } else if (this.has(cause, 'toColorString')) {
            msg.push({
                color: cause.toColorString(true),
                noColor: cause.toColorString(false)
            });
        }
        if (this.has(cause, 'cause')) {
            msg.push(...this.causeHandle(cause.cause));
        }
        return msg;
    }

    /**
     * 属性合并
     * @returns
     */
    private checkPosition (params: ErrorOptions): number {
        let msg = {
            color: '',
            noColor: ''
        }, wrap = 0;
        const { position } = params;
        if (position) {
            if (this.messageList.length > 0) {
                this.messageList.push(' >> ');
            }
            msg.color += `Error of ${position}`;
            msg.noColor += `Error of ${position}`;
        }
        const names = ['ClassName', 'FunctionName', 'ParameterName'];
        for (const name of names) {
            if (!(name in params)) {
                continue;
            }
            const value = params[name as keyof ErrorOptions];
            if (value) {
                msg.color += `\n[${splitByUpperCaseAndJoinWithSpaceUp(name)}: ${color('yellow', value.toString())}]`;
                msg.noColor += `\n[${splitByUpperCaseAndJoinWithSpaceUp(name)}: ${value.toString()}]`;
                wrap++;
            }
        }
        this.messageList.push({
            color: msg.color,
            noColor: msg.noColor
        });
        return wrap;
    }

    /**
     * 判断是否含有某个属性
     * @param options
     * @param property
     * @returns
     */
    private has (options: {[key: string]: any}, property: string): boolean {
        return (property in options) && options[property];
    }
}
