import {IMIOMember} from "./Member";

export class IMIOTeam {
    teamId: number = 0;
    // joinId: number = 0;
    userId: string = ''; // 群创建人
    teamName: string = '';
    teamNumber: string = '';
    avatar: string = '';
    members ?: Array<IMIOMember> = undefined;
    isMute: boolean = false; // 是否禁言
    remark: string = '';
}

export enum IMIOGroupType {
    public = 1,
    protected = 2,
    private = 3

}