import {IOIMessage} from "../entity/Message";


export interface IOIMessageListener {

    id : string;

    /**
     * 系统通知
     * message.label 有2种类型
     * IOIMessageLabel.notice 和 IOIMessageLabel.action
     */
    onNotice(message: IOIMessage): void

    // 正常消息
    onMessage(message: IOIMessage): void

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
