import {IMIOMessage} from "../entity/Message";


export interface IMIOMessageListener {

    // 系统通知
    onNotice(message: IMIOMessage): void

    // 正常消息
    onMessage(message: IMIOMessage): void

    /**
     * 消息撤销
     * @param joinId joinId
     * @param messageId 撤销的消息
     */
    onMessageRevoke(joinId: number, messageId: string): void

    /**
     * 对方已读消息
     * @param joinId joinId
     * @param messageId 对方已读消息
     */
    onMessageRead(joinId: number, messageId: string): void

    // onMessageMention(message: BBFMessage);

}
