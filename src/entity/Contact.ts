export class IMIOContact {
    contactId : number = 0;
    userId : string = '';
    joinId : number = 0;
    nickname : string = '';
    username : string = '';
    avatar : string = '';
    status : string = '';
    isGroup: boolean = false;
    joinTime: string = '';
    isMuted: boolean = false;
    noise: number = 1;
}

export enum IMIOContactNotice {
    normal = 1, // 正常提醒
    not_notify = 2, // 不通知
    reject = 0 // 拒收信息
}