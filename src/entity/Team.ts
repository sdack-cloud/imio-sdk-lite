import {IOIMember} from "./Member";

export class IOITeam {
    teamId: number = 0;
    // joinId: number = 0;
    userId: string = ''; // 群创建人
    teamName: string = '';
    teamNumber: string = '';
    avatar: string = '';
    members ?: Array<IOIMember> = undefined;
    isMute: boolean = false; // 是否禁言
    remark: string = '';
}

export enum IOIGroupType {
    public = 1,
    protected = 2,
    private = 3

}