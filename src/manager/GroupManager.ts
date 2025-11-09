import {IMIOClient} from "../Client";
import {Payload} from "rsocket-core";
import {IMIOBaseManager} from "./BaseManager";
import {IMIOMember} from "../entity/Member";
import {IMIOGroup, IMIOGroupType} from "../entity/Group";
import {IMIOContactManager} from "./ContactManager";
import {IMIOContact} from "../entity/Contact";

//  ======
import {onlyour as ContactPB} from "../protocol/Contacts";
import {onlyour as RoomPB} from "../protocol/Rooms";
import Contacts = ContactPB.imio.Contacts;
import Rooms = RoomPB.imio.Rooms;


export class IMIOGroupManager extends IMIOBaseManager{

    // ========= 单例模式 =========
    private static instance: IMIOGroupManager;

    public imioClient: IMIOClient | null = null;

    private constructor() {
        super();
    }

    public static getInstance(): IMIOGroupManager {
        if (!IMIOGroupManager.instance) {
            IMIOGroupManager.instance = new IMIOGroupManager();
        }
        return IMIOGroupManager.instance;
    }

    public setClient(client : IMIOClient) : IMIOGroupManager{
        this.imioClient = client
        return this
    }
    // ========= 单例模式 END =========


    /**
     * 查询群组
     * @param mode 1,人员，2 群组
     * @param name 人员用账号，群组用名称
     */
    public search(mode:number,name: string,page: number = 1, pageSie: number = 50): Promise<Array<IMIOGroup>> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            this.imioClient!!.meta.page = page;
            this.imioClient!!.meta.pageSize = pageSie;
            const param = new Rooms({
                meta: this.imioClient!!.meta,
                talkMode: mode,
                type: mode == 1? 'protected':'protected',
                roomname: mode == 1?'': name,
                account: mode == 1?name: ''
            });
            let res : Array<IMIOGroup>  = [];
            this.imioClient!!.socket?.requestStream({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('group.search'),
            }, this.imioClient!!.pageSize,{
                onComplete: () => {
                    resolve(res)
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (payload.data) {
                            let proto = Rooms.deserialize(payload.data);
                            let data = this.buildGroup(proto);
                            res.push(data);
                        }
                    }catch (e) {
                        reject(new Error("IMIO Client Error"))
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
     * 获取群成员
      * @param groupId joinId
     */
    public getMembers(groupId: number,page: number = 1): Promise<Array<IMIOMember>> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            this.imioClient!!.meta.page = page;
            const param = new Contacts({
                meta: this.imioClient!!.meta,
                joinRoomId: groupId,
            });
            let res : Array<IMIOMember>  = [];
            this.imioClient!!.socket?.requestStream({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('group.members'),
            }, this.imioClient!!.pageSize,{
                onComplete: () => {
                    resolve(res)
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (payload.data) {
                            let proto = Contacts.deserialize(payload.data);
                            let data = this.buildMember(proto);
                            res.push(data);
                        }
                    }catch (e) {
                        reject(new Error("IMIO Client Error"))
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
     * 获取一个群组
     * @param groupId
     */
    public getGroupById(groupId: number): Promise<IMIOGroup> {
        return new Promise<any>(async (resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }

            const param = new Contacts({
                meta: this.imioClient!!.meta,
                joinRoomId: groupId,
            });
            let res : IMIOGroup | null = null;
            this.imioClient!!.socket?.requestResponse({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('group.byId')
            }, {
                onComplete: () => {
                    resolve(res)
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (payload.data) {
                            let proto = Rooms.deserialize(payload.data);
                            let data = this.buildGroup(proto);
                            res = data;
                            if (isComplete) {
                                resolve(res)
                            }
                        }
                    }catch (e) {

                        reject(new Error("IMIO Client Error"))
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
     * 创建一对一的临时性对话
     * @param userId 用户
     * @param joinId 加入的群组
     */
    public createDialogue(userId: string,joinId: number): Promise<IMIOGroup> {
        return new Promise<any>(async (resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }

            const param = new Contacts({
                meta: this.imioClient!!.meta,
                userId: userId,
                joinRoomId:joinId
            });
            let res : IMIOGroup | null = null;
            this.imioClient!!.socket?.requestResponse({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('dialogue.create')
            }, {
                onComplete: () => {
                    resolve(res)
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (payload.data) {
                            let proto = Rooms.deserialize(payload.data);
                            let data = this.buildGroup(proto);
                            res = data;
                            if (isComplete) {
                                resolve(res)
                            }
                        }
                    }catch (e) {

                        reject(new Error("IMIO Client Error"))
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
     * 创建群
     * @param name 群名称
     * @param member 群成员
     */
    public createGroup(name: string, member: Array<string>): Promise<IMIOGroup> {
        return new Promise<any>(async (resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }

            let contacts = await IMIOContactManager.getInstance()
                .setClient(this.imioClient!!).getContactList();
            if (contacts.length <= 0) {
                reject(new Error("联系人获取失败"))
                return
            }
            let member1 = contacts.filter(it => !it.isGroup && (member.findIndex(itt => itt == it.userId)) != -1);
            if (member1.length <= 0) {
                reject(new Error("您设置的群成员不正确"))
                return
            }
            let userIds = member1.map(it => new Contacts({
                userId: it.userId
            }));
            const param = new Rooms({
                meta: this.imioClient!!.meta,
                roomname: name,
                users: userIds
            });
            let res : IMIOGroup | null = null;
            this.imioClient!!.socket?.requestResponse({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('group.create')
            }, {
                onComplete: () => {
                    resolve(res)
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (payload.data) {
                            let proto = Rooms.deserialize(payload.data);
                            let data = this.buildGroup(proto);
                            res = data;
                            if (isComplete) {
                                resolve(res)
                            }
                        }
                    }catch (e) {

                        reject(new Error("IMIO Client Error"))
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
     * 加入群
     * @param groupId
     * @param remark
     */
    public joinGroup(groupId: number,remark:string): Promise<Array<IMIOMember>> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            const param = new Contacts({
                meta: this.imioClient!!.meta,
                joinRoomId: groupId,
                remark:remark
            });
            let res : Array<IMIOMember>  = [];
            this.imioClient!!.socket?.requestStream({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('group.join'),
            }, this.imioClient!!.pageSize,{
                onComplete: () => {
                    resolve(res)
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (payload.data) {
                            let proto = Contacts.deserialize(payload.data);
                            let data = this.buildMember(proto);
                            res.push(data);
                        }
                    }catch (e) {
                        reject(new Error("IMIO Client Error"))
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
     * 邀请入群
     * @param groupId
     * @param userId
     */
    public groupInvite(groupId : number,userId: string): Promise<IMIOGroup> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            const param = new Contacts({
                meta: this.imioClient!!.meta,
                joinRoomId: groupId,
                fromUserId: userId
            });
            let res : Object | null = null;
            this.imioClient!!.socket?.requestResponse({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('group.invite')
            }, {
                onComplete: () => {
                    resolve(res)
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (payload.data) {
                            let proto = Rooms.deserialize(payload.data);
                            let data = this.buildGroup(proto);
                            res = data;
                            if (isComplete) {
                                resolve(res)
                            }
                        }
                    }catch (e) {
                        reject(new Error("IMIO Client Error"))
                    }
                }, onError: (error: Error) => {
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
     * 退出群聊
     * @param joinId
     */
    public exit(joinId : number): Promise<string> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            const param = new Contacts({
                meta: this.imioClient!!.meta,
                joinRoomId: joinId,
            });
            // let res : Object | null = null;
            this.imioClient!!.socket?.requestStream({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('group.exit')
            }, 30,{
                onComplete: () => {
                    resolve('')
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        // if (payload.data) {
                        //     let proto = Rooms.deserialize(payload.data);
                        //     let data = this.buildGroup(proto);
                        //     res = data;
                        // }
                    }catch (e) {
                        reject(new Error("IMIO Client Error"))
                    }
                }, onError: (error: Error) => {
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
     * 删除成员
     * @param joinId
     * @param userId
     */
    public removeMember(joinId : number,userId: string): Promise<string> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            const param = new Contacts({
                meta: this.imioClient!!.meta,
                joinRoomId: joinId,
                fromUserId: userId
            });
            let res : Object | null = null;
            this.imioClient!!.socket?.requestStream({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('group.remove')
            }, 30,{
                onComplete: () => {
                    resolve('')
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        // if (payload.data) {
                        //     let proto = Rooms.deserialize(payload.data);
                        //     let data = this.buildGroup(proto);
                        //     res = data;
                        // }
                    }catch (e) {
                        reject(new Error("IMIO Client Error"))
                    }
                }, onError: (error: Error) => {
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
     * 更换群主
     * @param joinId
     * @param userId 继任者
     */
    public changeOwner(joinId : number,userId: string): Promise<IMIOContact> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            const param = new Contacts({
                meta: this.imioClient!!.meta,
                joinRoomId: joinId,
                userId: userId
            });
            let res : Object | null = null;
            this.imioClient!!.socket?.requestResponse({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('group.change.owner')
            }, {
                onComplete: () => {
                    resolve(res)
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (payload.data) {
                            let proto = Contacts.deserialize(payload.data);
                            let data = this.buildContact(proto);
                            res = data;
                            if (isComplete) {
                                resolve(res)
                            }
                        }
                    }catch (e) {
                        reject(new Error("IMIO Client Error"))
                    }
                }, onError: (error: Error) => {
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
     * 设置或取消 管理员
     * @param joinId
     * @param userId 管理员
     */
    public setManager(joinId : number,userId: string): Promise<IMIOContact> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            const param = new Contacts({
                meta: this.imioClient!!.meta,
                joinRoomId: joinId,
                userId: userId
            });
            let res : Object | null = null;
            this.imioClient!!.socket?.requestResponse({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('group.set.manager')
            }, {
                onComplete: () => {
                    resolve('')
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        // if (payload.data) {
                        //     let proto = Contacts.deserialize(payload.data);
                        //     let data = this.buildContact(proto);
                        //     res = data;
                            if (isComplete) {
                                resolve('')
                            }
                        // }
                    }catch (e) {
                        reject(new Error("IMIO Client Error"))
                    }
                }, onError: (error: Error) => {
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
     * 拉黑成员 或移除拉黑
     * @param joinId
     * @param userId 继任者
     * @param operate true 拉黑，false 恢复
     */
    public addBlack(joinId : number,userId: string,operate: boolean): Promise<IMIOContact> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            const param = new Contacts({
                meta: this.imioClient!!.meta,
                joinRoomId: joinId,
                userId: userId,
                black: operate?1:0
            });
            let res : Object | null = null;
            this.imioClient!!.socket?.requestResponse({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('group.add.black')
            }, {
                onComplete: () => {
                    resolve(res)
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (payload.data) {
                            let proto = Contacts.deserialize(payload.data);
                            let data = this.buildContact(proto);
                            res = data;
                            if (isComplete) {
                                resolve(res)
                            }
                        }
                    }catch (e) {
                        reject(new Error("IMIO Client Error"))
                    }
                }, onError: (error: Error) => {
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
     * 成员 禁言
     * @param joinId
     * @param userId 继任者
     * @param operate true 禁言，false 恢复
     */
    public memberMuted(joinId : number,userId: string,operate: boolean): Promise<IMIOContact> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            const param = new Contacts({
                meta: this.imioClient!!.meta,
                joinRoomId: joinId,
                userId: userId,
                apply: operate?1:0
            });
            let res : Object | null = null;
            this.imioClient!!.socket?.requestResponse({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('group.member.muted')
            }, {
                onComplete: () => {
                    resolve(res)
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (payload.data) {
                            let proto = Contacts.deserialize(payload.data);
                            let data = this.buildContact(proto);
                            res = data;
                            if (isComplete) {
                                resolve(res)
                            }
                        }
                    }catch (e) {
                        reject(new Error("IMIO Client Error"))
                    }
                }, onError: (error: Error) => {
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
     * 群禁言
     * @param joinId
     * @param operate true 禁言，false 恢复
     */
    public groupMuted(joinId : number,operate: boolean): Promise<IMIOGroup> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            const param = new Contacts({
                meta: this.imioClient!!.meta,
                joinRoomId: joinId,
                apply: operate?1:0
            });
            let res : Object | null = null;
            this.imioClient!!.socket?.requestResponse({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('group.muted')
            }, {
                onComplete: () => {
                    resolve(res)
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (payload.data) {
                            let proto = Rooms.deserialize(payload.data);
                            let data = this.buildGroup(proto);
                            res = data;
                            if (isComplete) {
                                resolve(res)
                            }
                        }
                    }catch (e) {
                        reject(new Error("IMIO Client Error"))
                    }
                }, onError: (error: Error) => {
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
     * 设置入群问题
     * @param joinId
     * @param question
     * @param answer
     */
    public setGroupQuestion(joinId : number,question: string,answer: string): Promise<string> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            const param = new Contacts({
                meta: this.imioClient!!.meta,
                joinRoomId: joinId,
                username: question,
                remark: answer
            });
            let res : Object | null = null;
            this.imioClient!!.socket?.requestResponse({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('group.set.answer')
            }, {
                onComplete: () => {
                    resolve('')
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        // if (payload.data) {
                        //     let proto = Rooms.deserialize(payload.data);
                        //     let data = this.buildGroup(proto);
                        //     res = data;
                        // }
                        if (isComplete) {
                            resolve('')
                        }
                    }catch (e) {
                        reject(new Error("IMIO Client Error"))
                    }
                }, onError: (error: Error) => {
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
     * 设置群名称
     * @param joinId
     * @param name
     */
    public setGroupName(joinId : number,name: string): Promise<IMIOGroup> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            const param = new Contacts({
                meta: this.imioClient!!.meta,
                joinRoomId: joinId,
                username: name,
            });
            let res : Object | null = null;
            this.imioClient!!.socket?.requestResponse({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('group.set.groupname')
            }, {
                onComplete: () => {
                    resolve(res)
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (payload.data) {
                            let proto = Rooms.deserialize(payload.data);
                            let data = this.buildGroup(proto);
                            res = data;
                            if (isComplete) {
                                resolve(res)
                            }
                        }
                    }catch (e) {
                        reject(new Error("IMIO Client Error"))
                    }
                }, onError: (error: Error) => {
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
     * 设置群头像
     * @param joinId
     * @param avatar
     */
    public setGroupAvatar(joinId : number,avatar: string): Promise<IMIOGroup> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            const param = new Contacts({
                meta: this.imioClient!!.meta,
                joinRoomId: joinId,
                avatar: avatar,
            });
            let res : Object | null = null;
            this.imioClient!!.socket?.requestResponse({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('group.set.avatar')
            }, {
                onComplete: () => {
                    resolve(res)
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (payload.data) {
                            let proto = Rooms.deserialize(payload.data);
                            let data = this.buildGroup(proto);
                            res = data;
                            if (isComplete) {
                                resolve(res)
                            }
                        }
                    }catch (e) {
                        reject(new Error("IMIO Client Error"))
                    }
                }, onError: (error: Error) => {
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
     * 设置群描述
     * @param joinId
     * @param depict
     */
    public setGroupDepict(joinId : number,depict: string): Promise<IMIOGroup> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            const param = new Contacts({
                meta: this.imioClient!!.meta,
                joinRoomId: joinId,
                remark: depict,
            });
            let res : Object | null = null;
            this.imioClient!!.socket?.requestResponse({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('group.set.depict')
            }, {
                onComplete: () => {
                    resolve(res)
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (payload.data) {
                            let proto = Rooms.deserialize(payload.data);
                            let data = this.buildGroup(proto);
                            res = data;
                            if (isComplete) {
                                resolve(res)
                            }
                        }
                    }catch (e) {
                        reject(new Error("IMIO Client Error"))
                    }
                }, onError: (error: Error) => {
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
     * 设置群成员备注名称
     * @param joinId
     * @param userId
     * @param name
     */
    public setGroupMemberName(joinId : number,userId: string,name: string): Promise<IMIOGroup> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            const param = new Contacts({
                meta: this.imioClient!!.meta,
                joinRoomId: joinId,
                userId: userId,
                username: name,
            });
            let res : Object | null = null;
            this.imioClient!!.socket?.requestResponse({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('group.set.username')
            }, {
                onComplete: () => {
                    resolve('')
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        // if (payload.data) {
                        //     let proto = Rooms.deserialize(payload.data);
                        //     let data = this.buildGroup(proto);
                        //     res = data;
                            if (isComplete) {
                                resolve('')
                            }
                        // }
                    }catch (e) {
                        reject(new Error("IMIO Client Error"))
                    }
                }, onError: (error: Error) => {
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
     * 设置群类型
     * @param joinId
     * @param type
     */
    public setGroupType(joinId : number,type: IMIOGroupType): Promise<string> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            const param = new Contacts({
                meta: this.imioClient!!.meta,
                joinRoomId: joinId,
                apply: type,
            });
            let res : Object | null = null;
            this.imioClient!!.socket?.requestResponse({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('group.set.type')
            }, {
                onComplete: () => {
                    resolve('')
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        // if (payload.data) {
                        //     let proto = Rooms.deserialize(payload.data);
                        //     let data = this.buildGroup(proto);
                        //     res = data;
                        // }
                        if (isComplete) {
                            resolve('')
                        }
                    }catch (e) {
                        reject(new Error("IMIO Client Error"))
                    }
                }, onError: (error: Error) => {
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
     * 群是否可以私聊
     * @param joinId
     * @param operate true 可以，false 不可以
     */
    public isPrivateChat(joinId : number,operate: boolean): Promise<IMIOGroup> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            const param = new Contacts({
                meta: this.imioClient!!.meta,
                joinRoomId: joinId,
                apply: operate?1:0
            });
            let res : Object | null = null;
            this.imioClient!!.socket?.requestResponse({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('group.set.privateChat')
            }, {
                onComplete: () => {
                    resolve(res)
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (payload.data) {
                            let proto = Rooms.deserialize(payload.data);
                            let data = this.buildGroup(proto);
                            res = data;
                            if (isComplete) {
                                resolve(res)
                            }
                        }
                    }catch (e) {
                        reject(new Error("IMIO Client Error"))
                    }
                }, onError: (error: Error) => {
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
     * 入群是否审批
     * @param joinId
     * @param operate true 是，false 否
     */
    public isApply(joinId : number,operate: boolean): Promise<IMIOGroup> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            const param = new Contacts({
                meta: this.imioClient!!.meta,
                joinRoomId: joinId,
                apply: operate?1:0
            });
            let res : Object | null = null;
            this.imioClient!!.socket?.requestResponse({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('group.set.apply')
            }, {
                onComplete: () => {
                    resolve(res)
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (payload.data) {
                            let proto = Rooms.deserialize(payload.data);
                            let data = this.buildGroup(proto);
                            res = data;
                            if (isComplete) {
                                resolve(res)
                            }
                        }
                    }catch (e) {
                        reject(new Error("IMIO Client Error"))
                    }
                }, onError: (error: Error) => {
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
     * 邀请入群是否审批
     * @param joinId
     * @param operate true 是，false 否
     */
    public isInviteApply(joinId : number,operate: boolean): Promise<IMIOGroup> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            const param = new Contacts({
                meta: this.imioClient!!.meta,
                joinRoomId: joinId,
                apply: operate?1:0
            });
            let res : Object | null = null;
            this.imioClient!!.socket?.requestResponse({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('group.set.need')
            }, {
                onComplete: () => {
                    resolve(res)
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (payload.data) {
                            let proto = Rooms.deserialize(payload.data);
                            let data = this.buildGroup(proto);
                            res = data;
                            if (isComplete) {
                                resolve(res)
                            }
                        }
                    }catch (e) {
                        reject(new Error("IMIO Client Error"))
                    }
                }, onError: (error: Error) => {
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
     * 是否可以邀请入群
     * @param joinId
     * @param operate true 是，false 否
     */
    public isInvite(joinId : number,operate: boolean): Promise<IMIOGroup> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            const param = new Contacts({
                meta: this.imioClient!!.meta,
                joinRoomId: joinId,
                apply: operate?0:1
            });
            let res : Object | null = null;
            this.imioClient!!.socket?.requestResponse({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('group.set.invite')
            }, {
                onComplete: () => {
                    resolve(res)
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (payload.data) {
                            let proto = Rooms.deserialize(payload.data);
                            let data = this.buildGroup(proto);
                            res = data;
                            if (isComplete) {
                                resolve(res)
                            }
                        }
                    }catch (e) {
                        reject(new Error("IMIO Client Error"))
                    }
                }, onError: (error: Error) => {
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
     * 群信息是否可以撤回
     * @param joinId
     * @param operate true 是，false 否
     */
    public isRevokeMessage(joinId : number,operate: boolean): Promise<IMIOGroup> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            const param = new Contacts({
                meta: this.imioClient!!.meta,
                joinRoomId: joinId,
                apply: operate?1:0
            });
            let res : Object | null = null;
            this.imioClient!!.socket?.requestResponse({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('group.set.revoke')
            }, {
                onComplete: () => {
                    resolve(res)
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (payload.data) {
                            let proto = Rooms.deserialize(payload.data);
                            let data = this.buildGroup(proto);
                            res = data;
                            if (isComplete) {
                                resolve(res)
                            }
                        }
                    }catch (e) {
                        reject(new Error("IMIO Client Error"))
                    }
                }, onError: (error: Error) => {
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
                this.imioClient!!.clientListener?.onTokenExpired();
            } catch (e) {
            }
            return 'IMIO Token 已过期';
        }
        if (message.indexOf("SQL") > -1 || message.indexOf('connect') > -1) {
            return ("IMIO System Error");
        }
        if (message.indexOf("terminal") > -1 || message.indexOf('signal') > -1) {
            return ("请求超时");
        }
        return "";
    }

    private checkSocket(): string {
        if (!this.imioClient) {
            return ("IMIO Client 不存在")
        }
        if (!this.imioClient.socket) {
            return ("IMIO Client 尚未建立连接")
        }
        if (this.imioClient!!.getTokenAppId() == 0 || (this.imioClient!!.getTokenAppId() != this.imioClient!!.meta.appId)) {
            return ("token中的AppId 与 IMIOClientOption不一致")
        }
        return ''
    }


}