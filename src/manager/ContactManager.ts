import {IMIOClient} from "../Client";
import {IMIOBaseManager} from "./BaseManager";
import {Payload} from "rsocket-core";
import {IMIOMember} from "../entity/Member";
import {IMIOContact} from "../entity/Contact";

//  ======
import {onlyour as ContactPB} from "../protocol/Contacts";
import {onlyour as RoomPB} from "../protocol/Rooms";
import Contacts = ContactPB.imio.Contacts;
import Rooms = RoomPB.imio.Rooms;



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

    public setIMIOClient(client: IMIOClient): IMIOContactManager {
        this.imioClient = client
        return this
    }

    // ========= 单例模式 END =========

    /**
     * 获取联系人
     */
    public getContactList(): Promise<Array<IMIOContact>> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
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
            console.log("meta :",this.imioClient!!.meta.toObject());
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
     */




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