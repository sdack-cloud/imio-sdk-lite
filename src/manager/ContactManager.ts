import {IOIClient} from "../Client";
import {IOIBaseManager} from "./BaseManager";
import {Payload} from "rsocket-core";
import {IOIMember} from "../entity/Member";
import {IOIContact, IOIContactNotice} from "../entity/Contact";
import {IOIMessage} from "../entity/Message";

//  ======
import {only as ContactPB} from "../protocol/Contacts";
import {only as RoomPB} from "../protocol/Rooms";
import {only as MessageSignPB} from "../protocol/MessageSign";
import {only as MessagePB} from "../protocol/Message";
import Contacts = ContactPB.Contacts;
import Rooms = RoomPB.Rooms;
import MessageSign = MessageSignPB.MessageSign;
import Message = MessagePB.Message;



export class IOIContactManager extends IOIBaseManager {

    // ========= 单例模式 =========
    private static instance: IOIContactManager;

    public client: IOIClient | null = null;

    private constructor() {
        super();
    }

    public static getInstance(): IOIContactManager {
        if (!IOIContactManager.instance) {
            IOIContactManager.instance = new IOIContactManager();
        }
        return IOIContactManager.instance;
    }

    public setClient(client: IOIClient): IOIContactManager {
        this.client = client
        return this
    }

    // ========= 单例模式 END =========

    /**
     * 获取联系人
     */
    public getContactList(page:number  = 1,pageSize: number = 50): Promise<Array<IOIContact>> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            this.client!!.meta.page = page;
            this.client!!.meta.pageSize = pageSize;
            const param = new Contacts({
                meta: this.client!!.meta,
                joinRoomId: this.client!!.meta.roomId,
            });
            let res : Array<IOIContact>  = [];
            this.client!!.socket?.requestStream({
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
                            if (this.client) {
                                let index = this.client.contactList.findIndex(it => it.contactId == data.contactId);
                                if (index == -1) {
                                    this.client.contactList.push(data);
                                } else {
                                    this.client.contactList.splice(index,1,data);
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
    public getContactBlackList(page: number = 1): Promise<Array<IOIContact>> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            this.client!!.meta.page = page;
            const param = new Contacts({
                meta: this.client!!.meta,
                joinRoomId: this.client!!.meta.roomId,
            });
            let res : Array<IOIContact>  = [];
            this.client!!.socket?.requestStream({
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
    public getContactByUserId(userId: string): Promise<IOIContact> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            const param = new Contacts({
                meta: this.client!!.meta,
                userId: userId,
            });
            let res : Array<IOIContact>  = [];
            this.client!!.socket?.requestResponse({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('contact.byUserId'),
            },{
                onComplete: () => {
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (payload.data) {
                            let proto = Contacts.deserialize(payload.data);
                            let data = this.buildContact(proto);
                            res.push(data);
                            if (isComplete) {
                                resolve(data)
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
     * 获取联系人根据joinID
     */
    public getContactByJoinId(joinId: number): Promise<IOIContact | null> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            const param = new Contacts({
                meta: this.client!!.meta,
                joinRoomId: joinId,
            });
            let res : IOIContact | null = null;
            this.client!!.socket?.requestResponse({
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
                meta: this.client!!.meta,
                joinRoomId: groupId,
                remark: remark
            });
            let res : Object | null = null;
            this.client!!.socket?.requestResponse({
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
            // console.log("meta :", this.client!!.meta.toObject());
            const param = new Contacts({
                meta: this.client!!.meta,
                account: messageId,
                apply: apply? 1 : 0,
                remark: remark
            });
            let res : Object | null = null;
            this.client!!.socket?.requestResponse({
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
                meta: this.client!!.meta,
                id: contact.contactId,
                username: remark
            });
            let res : Object | null = null;
            this.client!!.socket?.requestResponse({
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
    public setNoticeLevel(joinId: number, rule: IOIContactNotice): Promise<any> {
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
                meta: this.client!!.meta,
                id: contact.contactId,
                noise: rule
            });
            let res : Object | null = null;
            this.client!!.socket?.requestResponse({
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
                meta: this.client!!.meta,
                userId: contact.userId,
                black: black
            });
            let res : Object | null = null;
            this.client!!.socket?.requestResponse({
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
                           try {
                               let index = this.client!!.contactList.findIndex(it => it.joinId == joinId);
                               if (index > -1) {
                                   this.client!!.contactList.splice(index, 1);
                               }
                           }catch (e) {
                           }
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
     * 删除好友
     * @param joinId
     */
    public delete(joinId: number): Promise<any> {
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
                meta: this.client!!.meta,
                userId: contact.userId,
            });
            let res : Object | null = null;
            this.client!!.socket?.requestResponse({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('contact.delete')
            }, {
                onComplete: () => {
                    resolve(res)
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                       if (payload.data) {
                           try {
                               let index = this.client!!.contactList.findIndex(it => it.joinId == joinId);
                               if (index > -1) {
                                   this.client!!.contactList.splice(index, 1);
                               }
                           }catch (e) {
                           }
                           if (isComplete) {
                               resolve("")
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
                meta: this.client!!.meta,
                userId: contact.userId,
                subgroup: name
            });
            let res : Object | null = null;
            this.client!!.socket?.requestResponse({
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
                meta: this.client!!.meta,
                userId: contact.userId,
                sort: sort
            });
            let res : Object | null = null;
            this.client!!.socket?.requestResponse({
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

    /**
     * 联系人聊天记录清除
     * @param userId
     */
    public cleanMessage(userId: string): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            let contact = await this.getContactByUserId(userId)
            if (!contact) {
                reject(new Error('联系人获取失败'))
                return;
            }
            const param = new Contacts({
                meta: this.client!!.meta,
                userId:userId,
            });
            let res : Object | null = null;
            this.client!!.socket?.requestResponse({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('contact.message.clean')
            }, {
                onComplete: () => {
                    resolve('')
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                       if (payload.data) {
                           if (isComplete) {
                               resolve('')
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
     * 消息未签收的
     */
    public messageNotSign(): Promise<Array<IOIMessage>> {
        return new Promise<any>(async (resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            const param = new MessageSign({
                meta: this.client!!.meta,
                roomId: this.client!!.meta.roomId,
            });
            let res : Array<IOIMessage>  = [];
            this.client!!.socket?.requestStream({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('message.not.sign')
            }, 300,{
                onComplete: () => {
                    resolve(res)
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                       if (payload.data) {
                           let proto = Message.deserialize(payload.data);
                           let data = this.buildMessage(proto);
                           res.push(data);
                           try {
                               for (let messageListener of this.client!!.messageListener) {
                                   try {
                                       messageListener?.onMessage?.(data)
                                   }catch (e) {
                                   }
                               }
                           }catch (e) {
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
                meta: this.client!!.meta,
                userId: userId,
                remark: remark
            });
            let res : Object | null = null;
            this.client!!.socket?.requestResponse({
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
            return ("token中的AppId 与 IOIClientOption不一致")
        }
        return ''
    }

}