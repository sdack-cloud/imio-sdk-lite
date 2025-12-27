import {IOIClient} from "../Client";
import {IOIBaseManager} from "./BaseManager";
import {IOIContactManager} from "./ContactManager";
import {Payload} from "rsocket-core";
import {IOIMember} from "../entity/Member";
import {IOIContact} from "../entity/Contact";
import {IOIMessageSender} from "../entity/MessageSender";
import {IOIMessage} from "../entity/Message";
import {IOIGroup} from "../entity/Group";

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
import {IOITeamManager} from "./TeamManager";

export class IOIChatManager extends IOIBaseManager {
    // ========= 单例模式 =========
    private static instance: IOIChatManager;

    public client: IOIClient | null = null;

    private constructor() {
        super();
    }

    public static getInstance(): IOIChatManager {
        if (!IOIChatManager.instance) {
            IOIChatManager.instance = new IOIChatManager();
        }
        return IOIChatManager.instance;
    }

    public setClient(client: IOIClient): IOIChatManager {
        this.client = client
        return this
    }

    // ========= 单例模式 END =========

    /**
     * 非好友关系，私聊
     * @param joinId 来源群聊的ID
     * @param userId 聊天的对象
     * @param sender
     * @param sender.joinId 新创建joinId。 IOIGroupManager.createDialogue 返回值
     */
    public dialogue(joinId: number,userId:string, sender: IOIMessageSender): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }

            let message1 = this.buildMessageProto( userId,sender);
            message1.appId = joinId;
            let res: Object | null = null;
            this.client!!.socket?.requestResponse({
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

    public oneToOne(sender: IOIMessageSender): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }

            let contactManager = IOIContactManager.getInstance().setClient(this.client!!);
            let ioContact = await contactManager.getContactByJoinId(sender.joinId);
            if (!ioContact) {
                reject(new Error("联系人不存在"))
                return
            }
            if (ioContact.isGroup) {
                reject(new Error("联系人是群组"))
                return;
            }
            let message1 = this.buildMessageProto(ioContact.userId,sender);
            let res: Object | null = null;
            this.client!!.socket?.requestResponse({
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


    public oneToMany(sender: IOIMessageSender): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            let contactManager = IOIContactManager.getInstance().setClient(this.client!!);
            let ioContact = await contactManager.getContactByJoinId(sender.joinId);
            if (!ioContact) {
                reject(new Error("联系人不存在"))
                return
            }
            if (!ioContact.isGroup) {
                reject(new Error("联系人不是群组"))
                return;
            }
            let message1 = this.buildMessageProto("",sender);
            let res: Object | null = null;
            this.client!!.socket?.requestResponse({
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
    public sendToTeam(sender: IOIMessageSender): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            let message1 = this.buildMessageProto("",sender);
            let res: Object | null = null;
            this.client!!.socket?.requestResponse({
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
                meta:this.client!!.meta,
                messageId: messageId,
                roomId: joinId,
                destId:this.client!!.meta.userId,
                deviceTag:'h5',
                deviceKey:this.client?.getDeviceKey()
            });
            this.client!!.socket?.requestResponse({
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
                meta:this.client!!.meta,
                messageId: messageId,
                roomId: joinId,
                destId:this.client!!.meta.userId
            });
            this.client!!.socket?.requestResponse({
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
                meta:this.client!!.meta,
                messageId: messageId,
                roomId: joinId,
            });
            this.client!!.socket?.requestResponse({
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
    public getMessageList(joinId: number,page: number = 1,pageSize: number = 40): Promise<Array<IOIMessage>> {
        return new Promise<any>(async (resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            let contactManager = IOIContactManager.getInstance().setClient(this.client!!);
            let ioContact = await contactManager.getContactByJoinId(joinId);
            if (!ioContact) {
                reject(new Error("联系人不存在"))
                return
            }
            this.client!!.meta.page = page;
            this.client!!.meta.pageSize = pageSize;
            const param = new Message({
                meta: this.client!!.meta,
                roomId: ioContact.joinId,
                created: ioContact.joinTime
            });
            let res : Array<IOIMessage>  = [];
            this.client!!.socket?.requestStream({
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
    public teamMessageList(teamId: number,page: number = 1,pageSize: number = 40): Promise<Array<IOIMessage>> {
        return new Promise<any>(async (resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            let teamManager = IOITeamManager.getInstance().setClient(this.client!!);
            let ioMember = await teamManager.getMember(teamId,this.client!!.meta.userId,this.client!!.meta.deviceKey );
            if (!ioMember) { // 获取成员主要是获取加入时间
                reject(new Error('您不在小队中'))
                return;
            }
            this.client!!.meta.page = page;
            this.client!!.meta.pageSize = pageSize;
            const param = new Message({
                meta: this.client!!.meta,
                roomId: teamId,
                created: ioMember.joinTime
            });
            let res : Array<IOIMessage>  = [];
            this.client!!.socket?.requestStream({
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
    public teamMessageById(teamId: number,messageId: string): Promise<IOIMessage> {
        return new Promise<any>(async (resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            const param = new Message({
                meta: this.client!!.meta,
                roomId: teamId,
                messageId: messageId
            });
            let res : IOIMessage | null  = null;
            this.client!!.socket?.requestResponse({
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
    public createDialogue(userId: string,joinId: number): Promise<IOIGroup> {
        return new Promise<any>(async (resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }

            const param = new Contacts({
                meta: this.client!!.meta,
                userId: userId,
                joinRoomId:joinId
            });
            let res : IOIGroup | null = null;
            this.client!!.socket?.requestResponse({
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


    private senderBuildMessage(sender: IOIMessageSender): IOIMessage {
        let ioMessage = new IOIMessage();
        ioMessage.msgId = sender.msgId;
        ioMessage.joinId = sender.joinId;
        ioMessage.cite = sender.cite;
        ioMessage.type = sender.type;
        ioMessage.title = sender.title;
        ioMessage.subtitle = sender.subtitle;
        ioMessage.text = sender.text;
        ioMessage.secret = sender.secret;
        ioMessage.thumb = sender.thumb;
        ioMessage.host = sender.host;
        ioMessage.url = sender.url;
        ioMessage.lng = sender.lng;
        ioMessage.lat = sender.lat;
        ioMessage.size = sender.size;
        ioMessage.length = sender.length;
        if (sender.hintList && sender.hintList.length) {
            ioMessage.hintList = [];
            for (let item of sender.hintList) {
                let ioMessage1 = new IOIMessage();
                ioMessage1.destId = item.targetId
                ioMessage1.destName = item.targetName
                ioMessage.hintList.push(ioMessage1)
            }
        }
        if (sender.notifyList && sender.notifyList.length) {
            ioMessage.notifyList = [];
            for (let item of sender.notifyList) {
                let ioMessage1 = new IOIMessage();
                ioMessage1.destId = item.targetId
                ioMessage1.destName = item.targetName
                ioMessage.notifyList.push(ioMessage1)
            }
        }
        if (sender.quietlyList && sender.quietlyList.length) {
            ioMessage.quietlyList = [];
            for (let item of sender.quietlyList) {
                let ioMessage1 = new IOIMessage();
                ioMessage1.destId = item.targetId
                ioMessage1.destName = item.targetName
                ioMessage.quietlyList.push(ioMessage1)
            }
        }
        return ioMessage;
    }

    private buildMessageProto(destId:string,sender: IOIMessageSender): Message {
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
            meta:this.client?.meta,
            msgId: sender.msgId,
            roomId: sender.joinId,
            fromId: this.client?.meta?.userId,
            fromName: this.client?.meta?.nickname,
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
            avatar:sender.avatar,
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