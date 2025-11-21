import {IMIOClient} from "../Client";
import {IMIOBaseManager} from "./BaseManager";
import {IMIOContactManager} from "./ContactManager";
import {Payload} from "rsocket-core";
import {IMIOMember} from "../entity/Member";
import {IMIOContact} from "../entity/Contact";
import {IMIOMessageSender} from "../entity/MessageSender";
import {IMIOMessage} from "../entity/Message";
import {IMIOGroup} from "../entity/Group";

//  ======
import {only as ContactPB} from "../protocol/Contacts";
import {only as RoomPB} from "../protocol/Rooms";
import {only as MessagePB} from "../protocol/Message";
import {only as MessageSignPB} from "../protocol/MessageSign";
import {only as MessageRemindPB} from "../protocol/MessageRemind";
import { only as TeamPB} from "../protocol/Teams";
import { only as TeamContactPB} from "../protocol/TeamContact";
import Teams = TeamPB.Teams;
import TeamContact = TeamContactPB.TeamContact;
import Rooms = RoomPB.Rooms;
import Message = MessagePB.Message;
import MessageSign = MessageSignPB.MessageSign;
import MessageRemind = MessageRemindPB.MessageRemind;
import Contacts = ContactPB.Contacts;
import {IMIOTeamManager} from "./TeamManager";

export class IMIOChatManager extends IMIOBaseManager {
    // ========= 单例模式 =========
    private static instance: IMIOChatManager;

    public imioClient: IMIOClient | null = null;

    private constructor() {
        super();
    }

    public static getInstance(): IMIOChatManager {
        if (!IMIOChatManager.instance) {
            IMIOChatManager.instance = new IMIOChatManager();
        }
        return IMIOChatManager.instance;
    }

    public setClient(client: IMIOClient): IMIOChatManager {
        this.imioClient = client
        return this
    }

    // ========= 单例模式 END =========

    /**
     * 非好友关系，私聊
     * @param joinId 来源群聊的ID
     * @param userId 聊天的对象
     * @param sender
     * @param sender.joinId 新创建joinId。 IMIOGroupManager.createDialogue 返回值
     */
    public dialogue(joinId: number,userId:string, sender: IMIOMessageSender): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }

            let message1 = this.buildMessageProto( userId,sender);
            message1.appId = joinId;
            let res: Object | null = null;
            this.imioClient!!.socket?.requestResponse({
                data: Buffer.from(message1.serializeBinary().buffer),
                metadata: this.buildRoute('dialogue')
            }, {
                onComplete: () => {
                    resolve(res)
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (payload.data) {
                            let proto = Message.deserialize(payload.data);
                            let data = this.buildMessage(proto);
                            res = data;
                            if (isComplete) {
                                resolve(res)
                            }
                        }
                    } catch (e) {
                        reject(new Error("IO Client Error"))
                    }
                }, onError: (error: Error) => {
                    let message = error?.message + "";
                    let errorMsg = this.onError(message);
                    if (errorMsg.length > 0) {
                        reject(new Error(errorMsg))
                    } else {
                        reject(new Error(message))
                    }
                }, onExtension(extendedType: number, content: Buffer | null | undefined, canBeIgnored: boolean): void {
                }
            })
        });
    }

    public oneToOne(sender: IMIOMessageSender): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }

            let contactManager = IMIOContactManager.getInstance().setClient(this.imioClient!!);
            let imioContact = await contactManager.getContactByJoinId(sender.joinId);
            if (!imioContact) {
                reject(new Error("联系人不存在"))
                return
            }
            if (imioContact.isGroup) {
                reject(new Error("联系人是群组"))
                return;
            }
            let message1 = this.buildMessageProto(imioContact.userId,sender);
            let res: Object | null = null;
            this.imioClient!!.socket?.requestResponse({
                data: Buffer.from(message1.serializeBinary().buffer),
                metadata: this.buildRoute('oneToOne')
            }, {
                onComplete: () => {
                    resolve(res)
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (payload.data) {
                            let proto = Message.deserialize(payload.data);
                            let data = this.buildMessage(proto);
                            res = data;
                            if (isComplete) {
                                resolve(res)
                            }
                        }
                    } catch (e) {
                        reject(new Error("IO Client Error"))
                    }
                }, onError: (error: Error) => {
                    let message = error?.message + "";
                    let errorMsg = this.onError(message);
                    if (errorMsg.length > 0) {
                        reject(new Error(errorMsg))
                    } else {
                        reject(new Error(message))
                    }
                }, onExtension(extendedType: number, content: Buffer | null | undefined, canBeIgnored: boolean): void {
                }
            })
        });
    }


    public oneToMany(sender: IMIOMessageSender): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            let contactManager = IMIOContactManager.getInstance().setClient(this.imioClient!!);
            let imioContact = await contactManager.getContactByJoinId(sender.joinId);
            if (!imioContact) {
                reject(new Error("联系人不存在"))
                return
            }
            if (!imioContact.isGroup) {
                reject(new Error("联系人不是群组"))
                return;
            }
            let message1 = this.buildMessageProto("",sender);
            let res: Object | null = null;
            this.imioClient!!.socket?.requestResponse({
                data: Buffer.from(message1.serializeBinary().buffer),
                metadata: this.buildRoute('oneToMany')
            }, {
                onComplete: () => {
                    resolve(res)
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (payload.data) {
                            let proto = Message.deserialize(payload.data);
                            let data = this.buildMessage(proto);
                            res = data;
                            if (isComplete) {
                                resolve(res)
                            }
                        }
                    } catch (e) {
                        reject(new Error("IO Client Error"))
                    }
                }, onError: (error: Error) => {
                    let message = error?.message + "";
                    let errorMsg = this.onError(message);
                    if (errorMsg.length > 0) {
                        reject(new Error(errorMsg))
                    } else {
                        reject(new Error(message))
                    }
                }, onExtension(extendedType: number, content: Buffer | null | undefined, canBeIgnored: boolean): void {
                }
            })
        });
    }

    /**
     * 给小队发送信息
     * @param joinId = teamId
     */
    public sendToTeam(sender: IMIOMessageSender): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            let message1 = this.buildMessageProto("",sender);
            let res: Object | null = null;
            this.imioClient!!.socket?.requestResponse({
                data: Buffer.from(message1.serializeBinary().buffer),
                metadata: this.buildRoute('oneToTeam')
            }, {
                onComplete: () => {
                    resolve(res)
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (payload.data) {
                            let proto = Message.deserialize(payload.data);
                            let data = this.buildMessage(proto);
                            res = data;
                            if (isComplete) {
                                resolve(res)
                            }
                        }
                    } catch (e) {
                        reject(new Error("IO Client Error"))
                    }
                }, onError: (error: Error) => {
                    let message = error?.message + "";
                    let errorMsg = this.onError(message);
                    if (errorMsg.length > 0) {
                        reject(new Error(errorMsg))
                    } else {
                        reject(new Error(message))
                    }
                }, onExtension(extendedType: number, content: Buffer | null | undefined, canBeIgnored: boolean): void {
                }
            })
        });
    }

    /**
     * 签收消息
     * @param messageId
     * @param joinId
     */
    public signMessage(messageId:string,joinId: number): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            let message = new MessageSign({
                meta:this.imioClient!!.meta,
                messageId: messageId,
                roomId: joinId,
                destId:this.imioClient!!.meta.userId,
                deviceTag:'h5',
                deviceKey:this.imioClient?.getDeviceKey()
            });
            this.imioClient!!.socket?.requestResponse({
                data: Buffer.from(message.serializeBinary().buffer),
                metadata: this.buildRoute('message.sign')
            }, {
                onComplete: () => {
                    resolve('')
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (isComplete) {
                            resolve("")
                        }
                    } catch (e) {
                        reject(new Error("IO Client Error"))
                    }
                }, onError: (error: Error) => {
                    let message = error?.message + "";
                    let errorMsg = this.onError(message);
                    if (errorMsg.length > 0) {
                        reject(new Error(errorMsg))
                    } else {
                        reject(new Error(message))
                    }
                }, onExtension(extendedType: number, content: Buffer | null | undefined, canBeIgnored: boolean): void {
                }
            })
        });
    }


    /**
     * 已读消息
     * @param messageId
     * @param joinId
     */
    public readMessage(messageId:string,joinId: number): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            let message = new MessageSign({
                meta:this.imioClient!!.meta,
                messageId: messageId,
                roomId: joinId,
                destId:this.imioClient!!.meta.userId
            });
            this.imioClient!!.socket?.requestResponse({
                data: Buffer.from(message.serializeBinary().buffer),
                metadata: this.buildRoute('message.read')
            }, {
                onComplete: () => {
                    resolve('')
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (isComplete) {
                            resolve('')
                        }
                    } catch (e) {
                        reject(new Error("IO Client Error"))
                    }
                }, onError: (error: Error) => {
                    let message = error?.message + "";
                    let errorMsg = this.onError(message);
                    if (errorMsg.length > 0) {
                        reject(new Error(errorMsg))
                    } else {
                        reject(new Error(message))
                    }
                }, onExtension(extendedType: number, content: Buffer | null | undefined, canBeIgnored: boolean): void {
                }
            })
        });
    }



    /**
     * 删除消息
     * @param messageId
     * @param joinId
     */
    public deleteMessage(messageId:string,joinId: number): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            let message = new MessageSign({
                meta:this.imioClient!!.meta,
                messageId: messageId,
                roomId: joinId,
            });
            this.imioClient!!.socket?.requestResponse({
                data: Buffer.from(message.serializeBinary().buffer),
                metadata: this.buildRoute('message.revoke')
            }, {
                onComplete: () => {
                    resolve('')
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (isComplete) {
                            resolve('')
                        }
                    } catch (e) {
                        reject(new Error("IO Client Error"))
                    }
                }, onError: (error: Error) => {
                    let message = error?.message + "";
                    let errorMsg = this.onError(message);
                    if (errorMsg.length > 0) {
                        reject(new Error(errorMsg))
                    } else {
                        reject(new Error(message))
                    }
                }, onExtension(extendedType: number, content: Buffer | null | undefined, canBeIgnored: boolean): void {
                }
            })
        });
    }

    /**
     * 获取信息
     * @param joinId
     * @param page
     * @param pageSize
     */
    public getMessageList(joinId: number,page: number = 1,pageSize: number = 40): Promise<Array<IMIOMessage>> {
        return new Promise<any>(async (resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            let contactManager = IMIOContactManager.getInstance().setClient(this.imioClient!!);
            let imioContact = await contactManager.getContactByJoinId(joinId);
            if (!imioContact) {
                reject(new Error("联系人不存在"))
                return
            }
            this.imioClient!!.meta.page = page;
            this.imioClient!!.meta.pageSize = pageSize;
            const param = new Message({
                meta: this.imioClient!!.meta,
                roomId: imioContact.joinId,
                created: imioContact.joinTime
            });
            let res : Array<IMIOMessage>  = [];
            this.imioClient!!.socket?.requestStream({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('message.page')
            }, 500,{
                onComplete: () => {
                    resolve(res)
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (payload.data) {
                            let proto = Message.deserialize(payload.data);
                            let data = this.buildMessage(proto);
                            res.push(data);
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
     * 获取小队信息
     * @param teamId
     * @param page
     * @param pageSize
     */
    public teamMessageList(teamId: number,page: number = 1,pageSize: number = 40): Promise<Array<IMIOMessage>> {
        return new Promise<any>(async (resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            let teamManager = IMIOTeamManager.getInstance().setClient(this.imioClient!!);
            let imioMember = await teamManager.getMember(teamId,this.imioClient!!.meta.userId,this.imioClient!!.meta.deviceKey,this.imioClient!!.meta.deviceTag );
            if (!imioMember) { // 获取成员主要是获取加入时间
                reject(new Error('您不在小队中'))
                return;
            }
            this.imioClient!!.meta.page = page;
            this.imioClient!!.meta.pageSize = pageSize;
            const param = new Message({
                meta: this.imioClient!!.meta,
                roomId: teamId,
                created: imioMember.joinTime
            });
            let res : Array<IMIOMessage>  = [];
            this.imioClient!!.socket?.requestStream({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('message.team.page')
            }, 500,{
                onComplete: () => {
                    resolve(res)
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (payload.data) {
                            let proto = Message.deserialize(payload.data);
                            let data = this.buildMessage(proto);
                            res.push(data);
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
     * 获取小对一条信息
     * @param teamId
     * @param messageId
     */
    public teamMessageById(teamId: number,messageId: string): Promise<IMIOMessage> {
        return new Promise<any>(async (resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            const param = new Message({
                meta: this.imioClient!!.meta,
                roomId: teamId,
                messageId: messageId
            });
            let res : IMIOMessage | null  = null;
            this.imioClient!!.socket?.requestResponse({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('message.team.byId')
            }, {
                onComplete: () => {
                    resolve(res)
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (payload.data) {
                            let proto = Message.deserialize(payload.data);
                            let data = this.buildMessage(proto);
                            res = (data);
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


    private senderBuildMessage(sender: IMIOMessageSender): IMIOMessage {
        let imioMessage = new IMIOMessage();
        imioMessage.messageId = sender.messageId;
        imioMessage.joinId = sender.joinId;
        imioMessage.cite = sender.cite;
        imioMessage.type = sender.type;
        imioMessage.title = sender.title;
        imioMessage.subtitle = sender.subtitle;
        imioMessage.text = sender.text;
        imioMessage.secret = sender.secret;
        imioMessage.thumb = sender.thumb;
        imioMessage.host = sender.host;
        imioMessage.url = sender.url;
        imioMessage.lng = sender.lng;
        imioMessage.lat = sender.lat;
        imioMessage.size = sender.size;
        imioMessage.length = sender.length;
        if (sender.hintList && sender.hintList.length) {
            imioMessage.hintList = [];
            for (let item of sender.hintList) {
                let imioMessage1 = new IMIOMessage();
                imioMessage1.destId = item.targetId
                imioMessage1.destName = item.targetName
                imioMessage.hintList.push(imioMessage1)
            }
        }
        if (sender.notifyList && sender.notifyList.length) {
            imioMessage.notifyList = [];
            for (let item of sender.notifyList) {
                let imioMessage1 = new IMIOMessage();
                imioMessage1.destId = item.targetId
                imioMessage1.destName = item.targetName
                imioMessage.notifyList.push(imioMessage1)
            }
        }
        if (sender.quietlyList && sender.quietlyList.length) {
            imioMessage.quietlyList = [];
            for (let item of sender.quietlyList) {
                let imioMessage1 = new IMIOMessage();
                imioMessage1.destId = item.targetId
                imioMessage1.destName = item.targetName
                imioMessage.quietlyList.push(imioMessage1)
            }
        }
        return imioMessage;
    }

    private buildMessageProto(destId:string,sender: IMIOMessageSender): Message {
        let cc:Array<MessageRemind> = [];
        let remind:Array<MessageRemind> = [];
        if (sender.notifyList && sender.notifyList.length) {
            for (let item of sender.notifyList) {
                let remind = new MessageRemind({
                    sort : 1,
                    destId: item.targetId,
                    nickname: item.targetName
                });
                cc.push(remind);
            }
        }
        if (sender.quietlyList && sender.quietlyList.length) {
            for (let item of sender.quietlyList) {
                let remind = new MessageRemind({
                    sort : 2,
                    destId: item.targetId,
                    nickname: item.targetName
                });
                cc.push(remind);
            }
        }
        if (sender.hintList && sender.hintList.length) {
            for (let item of sender.hintList) {
                let remind1 = new MessageRemind({
                    sort : 0,
                    destId: item.targetId,
                    nickname: item.targetName
                });
                remind.push(remind1);
            }
        }

        let message = new Message({
            meta:this.imioClient?.meta,
            messageId: sender.messageId,
            roomId: sender.joinId,
            fromId: this.imioClient?.meta?.userId,
            fromName: this.imioClient?.meta?.nickname,
            destId: destId,
            subtype: this.messageType(sender.type),
            title: sender.title,
            subtitle: sender.subtitle,
            text: sender.text,
            secret: sender.secret,
            thumb: sender.thumb,
            host: sender.host,
            url: sender.url,
            lng: sender.lng,
            lat: sender.lat,
            size: sender.size,
            length: sender.length,
            cc: cc,
            remind:remind,
            cite: sender.cite
        });

        return message
    }

    private messageType(t: String): number {
        switch (t) {
            case 'txt':
                return 1;
            case 'img':
                return 2;
            case 'audio':
                return 3;
            case 'video':
                return 4;
            case 'file':
                return 5;
            case 'loc':
                return 6;
            case 'wallet':
                return 9;
            case 'custom':
                return 7;
        }
        return 1;
    }

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