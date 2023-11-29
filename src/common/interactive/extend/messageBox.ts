import type { MessageBoxMethodType, MessageItemExtend } from "../types";
import { showMessage } from "../components/messageBox";
import { curry } from "../../../utils/functional";

/** 带确认按钮的消息弹框 */
export function showMessageWithConfirm (message: string, type: MessageBoxMethodType = "information") {
    return showMessage({
        type,
        message,
        items: [{
            id: 0,
            title: '确认'
        }]
    });
}

function showMessageExpand (
    modal: boolean, type: MessageBoxMethodType, items: Array<MessageItemExtend>, message: string, detail: string
) {
    return showMessage({
        type,
        modal,
        items,
        message,
        detail
    });
}

/** 系统弹框 */
export const showMessageModal = curry(showMessageExpand, true, 'information' as MessageBoxMethodType, [{id:0,title: '确认'}], '提示');