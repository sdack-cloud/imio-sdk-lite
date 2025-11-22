import {IMIOClient} from "../Client";
import {IMIOMember} from "../entity/Member";
import {Payload} from "rsocket-core";
import {IMIOTeam} from "../entity/Team";


// =====
import { only as TeamPB} from "../protocol/Teams";
import { only as TeamContactPB} from "../protocol/TeamContact";
import Teams = TeamPB.Teams;
import TeamContact = TeamContactPB.TeamContact;
import {IMIOBaseManager} from "./BaseManager";


export class IMIOTeamManager extends IMIOBaseManager{


    // ========= 单例模式 =========
    private static instance: IMIOTeamManager;

    public client: IMIOClient | null = null;

    private constructor() {
        super();
    }

    public static getInstance(): IMIOTeamManager {
        if (!IMIOTeamManager.instance) {
            IMIOTeamManager.instance = new IMIOTeamManager();
        }
        return IMIOTeamManager.instance;
    }

    public setClient(client : IMIOClient) : IMIOTeamManager{
        this.client = client
        return this
    }
    // ========= 单例模式 END =========



    public memberList(teamId: number): Promise<Array<IMIOMember>> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            const param = new TeamContact({
                meta: this.client!!.meta,
                fromTeamId: teamId,
            });
            let res : Array<IMIOMember> = [];
            this.client!!.socket?.requestStream({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('team.members'),
            }, 300,{
                onComplete: () => {
                    resolve(res)
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (payload.data) {
                            let proto = TeamContact.deserialize(payload.data);
                            let data = this.buildTeamMember(proto);
                            res.push(data);
                        }
                    }catch (e) {
                        reject(new Error("IO Client Error"))
                    }
                },
                onError: (error: Error) => {
                    let message = error?.message + "";
                    let errorMsg = this.onError(message);
                    if (errorMsg.length > 0) {
                        reject(new Error(errorMsg))
                    }else {
                        reject(new Error(message))
                    }
                }, onExtension(extendedType: number, content: Buffer | null | undefined, canBeIgnored: boolean): void {
                }
            })
        });
    }


    /**
     * 加入
     */
    public create(name: string): Promise<IMIOTeam> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            const param = new Teams({
                meta: this.client!!.meta,
                teamname: name,
                userId: (this.client!!.meta!!.userId),
                deviceKey: (this.client!!.meta!!.deviceKey),
                deviceTag: (this.client!!.meta!!.deviceTag),
            });
            let res : IMIOTeam | null  = null;
            this.client!!.socket?.requestResponse({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('team.create'),
            }, {
                onComplete: () => {
                    resolve(res)
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (payload.data) {
                            let proto = Teams.deserialize(payload.data);
                            let data = this.buildTeam(proto);
                            res = (data);
                            if (isComplete) {
                                resolve(res)
                            }
                        }
                    }catch (e) {
                        reject(new Error("IO Client Error"))
                    }
                },
                onError: (error: Error) => {
                    let message = error?.message + "";
                    let errorMsg = this.onError(message);
                    if (errorMsg.length > 0) {
                        reject(new Error(errorMsg))
                    }else {
                        reject(new Error(message))
                    }
                }, onExtension(extendedType: number, content: Buffer | null | undefined, canBeIgnored: boolean): void {
                }
            })
        });
    }

    /**
     * 加入
     */
    public getTeam(teamId: number): Promise<IMIOTeam> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            const param = new Teams({
                meta: this.client!!.meta,
                id: teamId,
            });
            let res : IMIOTeam | null  = null;
            this.client!!.socket?.requestResponse({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('team.byId'),
            }, {
                onComplete: () => {
                    resolve(res)
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (payload.data) {
                            let proto = Teams.deserialize(payload.data);
                            let data = this.buildTeam(proto);
                            res = (data);
                            if (isComplete) {
                                resolve(res)
                            }
                        }
                    }catch (e) {
                        reject(new Error("IO Client Error"))
                    }
                },
                onError: (error: Error) => {
                    let message = error?.message + "";
                    let errorMsg = this.onError(message);
                    if (errorMsg.length > 0) {
                        reject(new Error(errorMsg))
                    }else {
                        reject(new Error(message))
                    }
                }, onExtension(extendedType: number, content: Buffer | null | undefined, canBeIgnored: boolean): void {
                }
            })
        });
    }


    /**
     * 加入
     * @param teamId
     * @param remark
     */
    public join(teamId: number): Promise<IMIOTeam> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            const param = new TeamContact({
                meta: this.client!!.meta,
                fromTeamId: teamId,
                userId: (this.client!!.meta!!.userId),
                deviceKey: (this.client!!.meta!!.deviceKey),
                deviceTag: (this.client!!.meta!!.deviceTag),
            });
            let res : IMIOTeam | null  = null;
            this.client!!.socket?.requestResponse({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('team.join'),
            }, {
                onComplete: () => {
                    resolve(res)
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (payload.data) {
                            let proto = Teams.deserialize(payload.data);
                            let data = this.buildTeam(proto);
                            res = (data);
                            if (isComplete) {
                                resolve(res)
                            }
                        }
                    }catch (e) {
                        reject(new Error("IO Client Error"))
                    }
                },
                onError: (error: Error) => {
                    let message = error?.message + "";
                    let errorMsg = this.onError(message);
                    if (errorMsg.length > 0) {
                        reject(new Error(errorMsg))
                    }else {
                        reject(new Error(message))
                    }
                }, onExtension(extendedType: number, content: Buffer | null | undefined, canBeIgnored: boolean): void {
                }
            })
        });
    }

    /**
     * 邀请加入
     * @param teamId
     * @param userId
     * @param deviceKey
     */
    public joinInvite(teamId: number,userId: string = '',deviceKey:string =""): Promise<IMIOTeam> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            if (userId.length <= 0 && deviceKey.length <= 0) {
                reject(new Error("用户的ID 和 设备Key 必选一组"))
                return;
            }
            const param = new TeamContact({
                meta: this.client!!.meta,
                fromTeamId: teamId,
                userId: userId,
                deviceKey: deviceKey,
                deviceTag: "h5",
            });
            let res : IMIOTeam | null  = null;
            this.client!!.socket?.requestResponse({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('team.join'),
            }, {
                onComplete: () => {
                    resolve(res)
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (payload.data) {
                            let proto = Teams.deserialize(payload.data);
                            let data = this.buildTeam(proto);
                            res = (data);
                            if (isComplete) {
                                resolve(res)
                            }
                        }
                    }catch (e) {
                        reject(new Error("IO Client Error"))
                    }
                },
                onError: (error: Error) => {
                    let message = error?.message + "";
                    let errorMsg = this.onError(message);
                    if (errorMsg.length > 0) {
                        reject(new Error(errorMsg))
                    }else {
                        reject(new Error(message))
                    }
                }, onExtension(extendedType: number, content: Buffer | null | undefined, canBeIgnored: boolean): void {
                }
            })
        });
    }



    /**
     * 解散
     * @param teamId
     */
    public disband(teamId: number): Promise<IMIOTeam> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            const param = new TeamContact({
                meta: this.client!!.meta,
                fromTeamId: teamId,
            });
            let res : IMIOTeam | null  = null;
            this.client!!.socket?.requestResponse({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('team.disband'),
            },{
                onComplete: () => {
                    resolve(res)
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (payload.data) {
                            let proto = Teams.deserialize(payload.data);
                            let data = this.buildTeam(proto);
                            res = (data);
                            if (isComplete) {
                                resolve(res)
                            }
                        }
                    }catch (e) {
                        reject(new Error("IO Client Error"))
                    }
                },
                onError: (error: Error) => {
                    let message = error?.message + "";
                    let errorMsg = this.onError(message);
                    if (errorMsg.length > 0) {
                        reject(new Error(errorMsg))
                    }else {
                        reject(new Error(message))
                    }
                }, onExtension(extendedType: number, content: Buffer | null | undefined, canBeIgnored: boolean): void {
                }
            })
        });
    }


    /**
     * 恢复
     * @param teamId
     */
    public regain(teamId: number): Promise<IMIOTeam> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            const param = new TeamContact({
                meta: this.client!!.meta,
                fromTeamId: teamId,
            });
            let res : IMIOTeam | null  = null;
            this.client!!.socket?.requestResponse({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('team.regain'),
            }, {
                onComplete: () => {
                    resolve(res)
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (payload.data) {
                            let proto = Teams.deserialize(payload.data);
                            let data = this.buildTeam(proto);
                            res = (data);
                            if (isComplete) {
                                resolve(res)
                            }
                        }
                    }catch (e) {
                        reject(new Error("IO Client Error"))
                    }
                },
                onError: (error: Error) => {
                    let message = error?.message + "";
                    let errorMsg = this.onError(message);
                    if (errorMsg.length > 0) {
                        reject(new Error(errorMsg))
                    }else {
                        reject(new Error(message))
                    }
                }, onExtension(extendedType: number, content: Buffer | null | undefined, canBeIgnored: boolean): void {
                }
            })
        });
    }


    /**
     * 禁言
     * @param teamId
     * @param operate true 禁言，false 恢复
     */
    public teamMuted(teamId: number, operate: boolean): Promise<IMIOTeam> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            const param = new TeamContact({
                meta: this.client!!.meta,
                fromTeamId: teamId,
                muted: operate?1:0
            });
            let res : IMIOTeam | null  = null;
            this.client!!.socket?.requestResponse({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('team.muted'),
            }, {
                onComplete: () => {
                    resolve(res)
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (payload.data) {
                            let proto = Teams.deserialize(payload.data);
                            let data = this.buildTeam(proto);
                            res = (data);
                            if (isComplete) {
                                resolve(res)
                            }
                        }
                    }catch (e) {
                        reject(new Error("IO Client Error"))
                    }
                },
                onError: (error: Error) => {
                    let message = error?.message + "";
                    let errorMsg = this.onError(message);
                    if (errorMsg.length > 0) {
                        reject(new Error(errorMsg))
                    }else {
                        reject(new Error(message))
                    }
                }, onExtension(extendedType: number, content: Buffer | null | undefined, canBeIgnored: boolean): void {
                }
            })
        });
    }


    /**
     * 获取一个成员
     * @param teamId
     * @param userId 用户的ID 和 设备选一组
     * @param deviceKey
     * @param deviceTag
     */
    public getMember(teamId: number,userId: string = '',deviceKey:string =""): Promise<IMIOMember> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            if (userId.length <= 0 && deviceKey.length <= 0) {
                reject(new Error("用户的ID 和 设备Key 必选一组"))
                return;
            }
            const param = new TeamContact({
                meta: this.client!!.meta,
                fromTeamId: teamId,
                userId : userId,
                deviceKey: deviceKey,
                deviceTag: 'h5'
            });
            let res : IMIOMember | null  = null;
            this.client!!.socket?.requestResponse({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('team.member.get'),
            }, {
                onComplete: () => {
                    resolve(res)
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (payload.data) {
                            let proto = TeamContact.deserialize(payload.data);
                            let data = this.buildTeamMember(proto);
                            res = (data);
                            if (isComplete) {
                                resolve(res)
                            }
                        }
                    }catch (e) {
                        reject(new Error("IO Client Error"))
                    }
                },
                onError: (error: Error) => {
                    let message = error?.message + "";
                    let errorMsg = this.onError(message);
                    if (errorMsg.length > 0) {
                        reject(new Error(errorMsg))
                    }else {
                        reject(new Error(message))
                    }
                }, onExtension(extendedType: number, content: Buffer | null | undefined, canBeIgnored: boolean): void {
                }
            })
        });
    }














    private onError(message: string): string {
        if (message.indexOf("Jwt") > -1) {
            try {
                this.client!!.clientListener?.onTokenExpired();
            } catch (e) {
            }
            return 'IO Token 已过期';
        }
        if (message.indexOf("SQL") > -1 || message.indexOf('connect') > -1) {
            return ("IO System Error");
        }
        if (message.indexOf("terminal") > -1 || message.indexOf('signal') > -1) {
            return ("请求超时");
        }
        return "";
    }

    private checkSocket(): string {
        if (!this.client) {
            return ("IO Client 不存在")
        }
        if (!this.client.socket) {
            return ("IO Client 尚未建立连接")
        }
        if (this.client!!.getTokenAppId() == 0 || (this.client!!.getTokenAppId() != this.client!!.meta.appId)) {
            return ("token中的AppId 与 IMIOClientOption不一致")
        }
        return ''
    }


}