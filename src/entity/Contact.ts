export class IMIOContact {
    contactId : number = 0;
    userId : string = '';
    joinId : number = 0;
    nickname : string = '';
    username : string = '';
    avatar : string = '';
    subgroup : string = '';
    status : IMIOContactStatus = IMIOContactStatus.done;
    isGroup: boolean = false;
    joinTime: string = '';
    isMuted: boolean = false;
    noise: number = 1;
    sort: number = 0;
}

export enum IMIOContactNotice {
    normal = 1, // 正常提醒
    not_notify = 2, // 不通知
    reject = 0 // 拒收信息
}
export enum IMIOContactStatus {
    done = '',
    offline = 'offline',
    online = 'online',
    online_busy = 'online-busy',
    online_leave = 'online-leave',
}