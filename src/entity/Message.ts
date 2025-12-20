
export class IOIMessage {
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
    label: IOIMessageLabel | null = null;
    tag: string = '';
    sent: string = '';
    deviceKey: string = '';
    deviceTag: string = '';
    revoke: boolean = false;
    talk:IOIMessageTalk = IOIMessageTalk.default;
    citeData: IOIMessage | null = null;
    sentDate: Date | null = null;

    hintList:Array<IOIMessage> | null = null;// 提及人列表
    notifyList:Array<IOIMessage> | null = null // 抄送人
    quietlyList:Array<IOIMessage> | null = null // 密送人
}

export enum IOIMessageLabel {
    tip = 'tip', // 提示消息
    notice = 'notice', // 通知消息
    action = 'action', // 审批消息
    notify = 'notify', // 抄送消息
    quietly = 'quietly', // 密送消息
}

export enum IOIMessageTalk {
    default = 1, // 联系人
    group = 2, // 群组
    team = 3 // 小队
}

