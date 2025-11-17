import {IMIOClient} from "../Client";
import {IMIOBaseManager} from "./BaseManager";
import {Payload} from "rsocket-core";
import {IMIOMember} from "../entity/Member";
import {IMIOContact, IMIOContactNotice} from "../entity/Contact";

//  ======
import {only as ContactPB} from "../protocol/Contacts";
import {only as RoomPB} from "../protocol/Rooms";
import Contacts = ContactPB.Contacts;
import Rooms = RoomPB.Rooms;



export class IMIOContactManager extends IMIOBaseManager {

    // ========= 单例模式 =========
    private static instance: IMIOContactManager;

    public imioClient: IMIOClient | null = null;

    private constructor() {
        super();
    }

    public static getInstance(): IMIOContactManager {
        if (!IMIOContactManager.instance) {
            IMIOContactManager.instance = new IMIOContactManager();
        }
        return IMIOContactManager.instance;
    }

    public setClient(client: IMIOClient): IMIOContactManager {
        this.imioClient = client
        return this
    }

    // ========= 单例模式 END =========

    /**
     * 获取联系人
     */
    public getContactList(page:number  = 1,pageSize: number = 50): Promise<Array<IMIOContact>> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            this.imioClient!!.meta.page = page;
            this.imioClient!!.meta.pageSize = pageSize;
            const param = new Contacts({
                meta: this.imioClient!!.meta,
                joinRoomId: this.imioClient!!.meta.roomId,
            });
            let res : Array<IMIOContact>  = [];
            this.imioClient!!.socket?.requestStream({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('contact.list'),
            }, 3000,{
                onComplete: () => {
                    resolve(res)
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (payload.data) {
                            let proto = Contacts.deserialize(payload.data);
                            let data = this.buildContact(proto);
                            res.push(data);
                            if (this.imioClient) {
                                let index = this.imioClient.contactList.findIndex(it => it.contactId == data.contactId);
                                if (index == -1) {
                                    this.imioClient.contactList.push(data);
                                } else {
                                    this.imioClient.contactList.splice(index,1,data);
                                }
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
     * 获取联系人的黑名单
     */
    public getContactBlackList(page: number = 1): Promise<Array<IMIOContact>> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            this.imioClient!!.meta.page = page;
            const param = new Contacts({
                meta: this.imioClient!!.meta,
                joinRoomId: this.imioClient!!.meta.roomId,
            });
            let res : Array<IMIOContact>  = [];
            this.imioClient!!.socket?.requestStream({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('contact.black.list'),
            }, 3000,{
                onComplete: () => {
                    resolve(res)
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (payload.data) {
                            let proto = Contacts.deserialize(payload.data);
                            let data = this.buildContact(proto);
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
     * 获取联系人根据用户ID
     */
    public getContactByUserId(userId: string): Promise<IMIOContact> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            const param = new Contacts({
                meta: this.imioClient!!.meta,
                userId: userId,
            });
            let res : Array<IMIOContact>  = [];
            this.imioClient!!.socket?.requestStream({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('contact.byUserId'),
            }, 3000,{
                onComplete: () => {
                    resolve(res)
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (payload.data) {
                            let proto = Contacts.deserialize(payload.data);
                            let data = this.buildContact(proto);
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
     * 获取联系人根据joinID
     */
    public getContactByJoinId(joinId: number): Promise<IMIOContact | null> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            const param = new Contacts({
                meta: this.imioClient!!.meta,
                joinRoomId: joinId,
            });
            let res : IMIOContact | null = null;
            this.imioClient!!.socket?.requestResponse({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('contact.byJoinId'),
            },{
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
     * 添加好友
     * @param groupId 用户房间
     * @param remark 留言
     */
    public addContact(groupId: number, remark: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            const param = new Contacts({
                meta: this.imioClient!!.meta,
                joinRoomId: groupId,
                remark: remark
            });
            let res : Object | null = null;
            this.imioClient!!.socket?.requestResponse({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('contact.add')
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
     * 处理申请
     * @param messageId 用户房间
     * @param apply 申请结果
     * @param remark 留言
     */
    public handleApply(messageId: string, apply: boolean, remark: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            // console.log("meta :", this.imioClient!!.meta.toObject());
            const param = new Contacts({
                meta: this.imioClient!!.meta,
                account: messageId,
                apply: apply? 1 : 0,
                remark: remark
            });
            let res : Object | null = null;
            this.imioClient!!.socket?.requestResponse({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('handle.apply')
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
     * 设置备注名称
     * @param joinId
     * @param remark
     */
    public setRemarkName(joinId: number, remark: string): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }

            let contact = await this.getContactByJoinId(joinId);
            if (!contact) {
                reject(new Error('联系人获取失败'))
                return;
            }
            const param = new Contacts({
                meta: this.imioClient!!.meta,
                id: contact.contactId,
                username: remark
            });
            let res : Object | null = null;
            this.imioClient!!.socket?.requestResponse({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('contact.username')
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
                        reject(new Error("IO Client Error"))
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
     * 设置 通知范围
     * @param joinId
     * @param rule
     */
    public setNoticeLevel(joinId: number, rule: IMIOContactNotice): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }

            let contact = await this.getContactByJoinId(joinId);
            if (!contact) {
                reject(new Error('联系人获取失败'))
                return;
            }
            const param = new Contacts({
                meta: this.imioClient!!.meta,
                id: contact.contactId,
                noise: rule
            });
            let res : Object | null = null;
            this.imioClient!!.socket?.requestResponse({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('contact.noise')
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
                        reject(new Error("IO Client Error"))
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
     * 设置 或移除 黑名单
     * @param joinId
     * @param black
     */
    public setBlack(joinId: number, black: number): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }

            let contact = await this.getContactByJoinId(joinId);
            if (!contact) {
                reject(new Error('联系人获取失败'))
                return;
            }
            if (contact.isGroup) {
                reject(new Error('群禁止设置'))
                return;
            }
            const param = new Contacts({
                meta: this.imioClient!!.meta,
                userId: contact.userId,
                black: black
            });
            let res : Object | null = null;
            this.imioClient!!.socket?.requestResponse({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('contact.black')
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
                        reject(new Error("IO Client Error"))
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
     * 设置 联系人分组
     * @param joinId
     * @param name
     */
    public setSubgroup(joinId: number, name: string): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            let contact = await this.getContactByJoinId(joinId);
            if (!contact) {
                reject(new Error('联系人获取失败'))
                return;
            }
            const param = new Contacts({
                meta: this.imioClient!!.meta,
                userId: contact.userId,
                subgroup: name
            });
            let res : Object | null = null;
            this.imioClient!!.socket?.requestResponse({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('contact.subgroup')
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
                        reject(new Error("IO Client Error"))
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
     * 设置 联系人排序
     * @param joinId
     * @param sort
     */
    public setSort(joinId: number, sort: number): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            let contact = await this.getContactByJoinId(joinId);
            if (!contact) {
                reject(new Error('联系人获取失败'))
                return;
            }
            const param = new Contacts({
                meta: this.imioClient!!.meta,
                userId: contact.userId,
                sort: sort
            });
            let res : Object | null = null;
            this.imioClient!!.socket?.requestResponse({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('contact.sort')
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
                        reject(new Error("IO Client Error"))
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




    /*
    public addContact(userId: string, remark: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            const param = new Contacts({
                meta: this.imioClient!!.meta,
                userId: userId,
                remark: remark
            });
            let res : Object | null = null;
            this.imioClient!!.socket?.requestResponse({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('')
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
                        reject(new Error("IO Client Error"))
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
     */




    private onError(message: string): string {
        if (message.indexOf("Jwt") > -1) {
            try {
                this.imioClient!!.clientListener?.onTokenExpired();
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
        if (!this.imioClient) {
            return ("IO Client 不存在")
        }
        if (!this.imioClient.socket) {
            return ("IO Client 尚未建立连接")
        }
        if (this.imioClient!!.getTokenAppId() == 0 || (this.imioClient!!.getTokenAppId() != this.imioClient!!.meta.appId)) {
            return ("token中的AppId 与 IMIOClientOption不一致")
        }
        return ''
    }

}