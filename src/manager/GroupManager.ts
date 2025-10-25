import {IMIOClient} from "../Client";
import {Payload} from "rsocket-core";

//  ======
import {onlyour as ContactPB} from "../protocol/Contacts";
import {onlyour as RoomPB} from "../protocol/Rooms";
import Contacts = ContactPB.imio.Contacts;
import Rooms = RoomPB.imio.Rooms;
import {IMIOBaseManager} from "./BaseManager";
import {IMIOMember} from "../entity/Member";
import {IMIOGroup} from "../entity/Group";
import {IMIOContactManager} from "./ContactManager";

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

    public setIMIOClient(client : IMIOClient) : IMIOGroupManager{
        this.imioClient = client
        return this
    }
    // ========= 单例模式 END =========


    /**
     * 获取群成员
      * @param groupId
     */
    public getMembers(groupId: number): Promise<Array<IMIOMember>> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
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
                .setIMIOClient(this.imioClient!!).getContactList();
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
        return "";
    }

    private checkSocket(): string {
        if (!this.imioClient) {
            return ("IMIO Client 不存在")
        }
        if (!this.imioClient.socket) {
            return ("IMIO Client 尚未建立连接")
        }
        return ''
    }


}