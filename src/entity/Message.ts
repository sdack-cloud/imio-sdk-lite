
export class IMIOMessage {
    messageId:string = '';
    joinId : number = 0;
    fromId: string = '';
    fromName: string = '';
    destId: string = '';
    destName: string = '';
    cite: string = '';
    type: string = '';
    title: string = '';
    subtitle: string = '';
    text: string = '';
    secret: string = '';
    thumb: string = '';
    host: string = '';
    url: string = '';
    lng: string = '';
    lat: string = '';
    size:number = 0;
    length :number = 0;
    label: IMIOMessageLabel | null = null;
    tag: string = '';
    sent: string = '';
    revoke: boolean = false;
    talk:IMIOMessageTalk = IMIOMessageTalk.default;
    citeData: IMIOMessage | null = null;
    sentDate: Date | null = null;

    hintList:Array<IMIOMessage> | null = null;// 提及人列表
    notifyList:Array<IMIOMessage> | null = null // 抄送人
    quietlyList:Array<IMIOMessage> | null = null // 密送人
}

export enum IMIOMessageLabel {
    tip = 'tip', // 提示消息
    notice = 'notice', // 通知消息
    action = 'action', // 审批消息
    notify = 'notify', // 抄送消息
    quietly = 'quietly', // 密送消息
}

export enum IMIOMessageTalk {
    default = 1, // 联系人
    group = 2, // 群组
    team = 3 // 小队
}

export class IMIOMessageRemind {

}