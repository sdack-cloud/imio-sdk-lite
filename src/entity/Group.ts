import {IMIOMember} from "./Member";

export class IMIOGroup {
    groupId: number = 0;
    joinId: number = 0;
    userId: string = ''; // 群创建人
    groupName: string = '';
    groupNumber: string = '';
    avatar: string = '';
    members ?: Array<IMIOMember> = undefined;
    depict: string = ''; // 群描述
    isGroup: boolean = false; // 是用户还是群组
    isTalk: boolean = false; // 是否允许私聊
    isMute: boolean = false; // 是否禁言
    isApproval: boolean = true; //入群申请是否审批 true 审批，false 不审批
    isInviteApply: boolean = true; // 邀请入群是否审批
    isInvite: boolean = true; // 是否允许邀请 true 允许，false 不允许
    isRevoke: boolean = true; // 是否消息撤销 true 允许，false 不允许
    maxMember :number = 200 // 群最大人数
    ask: string = ''; // 入群问题
    remark: string = '';
    type: IMIOGroupType = IMIOGroupType.protected; // 房间类型
    isLive: boolean = false;
}

export enum IMIOGroupType {
    public = 1,
    protected = 2,
    private = 3

}