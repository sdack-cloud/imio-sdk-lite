import {IOIClient} from "../Client";
import {Payload} from "rsocket-core";
import {IOIBaseManager} from "./BaseManager";
import {IOIMember} from "../entity/Member";
import {IOIGroup, IOIGroupType} from "../entity/Group";
import {IOIContactManager} from "./ContactManager";
import {IOIContact} from "../entity/Contact";
import {IOIMessage, IOIMessageLabel} from "../entity/Message";
import {IOIDeviceStatus} from "../entity/Status";

//  ======
import {only as ContactPB} from "../protocol/Contacts";
import {only as RoomPB} from "../protocol/Rooms";
import {only as UserPB} from "../protocol/Users";
import Users = UserPB.Users;
import {only as MessagePB} from "../protocol/Message";
import Message = MessagePB.Message;
import Contacts = ContactPB.Contacts;
import {only as UserStatusPB} from "../protocol/UserStatus";
import UserStatus = UserStatusPB.UserStatus;

export class IOIUserInfoManager extends IOIBaseManager{
// ========= 单例模式 =========
    private static instance: IOIUserInfoManager;

    public client: IOIClient | null = null;

    private constructor() {
        super();
    }

    public static getInstance(): IOIUserInfoManager {
        if (!IOIUserInfoManager.instance) {
            IOIUserInfoManager.instance = new IOIUserInfoManager();
        }
        return IOIUserInfoManager.instance;
    }

    public setClient(client : IOIClient) : IOIUserInfoManager{
        this.client = client
        return this
    }
    // ========= 单例模式 END =========

    /**
     * 获取用户设备状态
     * @param userId
     */
    public getUserDeviceStatus(userId: string): Promise<Array<IOIDeviceStatus>> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            const param = new UserStatus({
                meta: this.client!!.meta,
                userId,
            });
            let res : Array<IOIDeviceStatus> = [];
            this.client!!.socket?.requestStream({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('device.status.byUserid')
            }, 100,{
                onComplete: () => {
                    resolve(res)
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (payload.data) {
                            let proto = UserStatus.deserialize(payload.data);
                            let data = this.buildDeviceStatus(proto);
                            res.push(data)
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
     * 更新我的设备状态
     * @param status
     */
    public updateDeviceStatus(status: IOIDeviceStatus): Promise<Array<IOIDeviceStatus>> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            const param = new UserStatus({
                meta: this.client!!.meta,
                status: status.toString()
            });
            let res : Array<IOIDeviceStatus> = [];
            this.client!!.socket?.requestStream({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('device.status.update')
            }, 100,{
                onComplete: () => {
                    resolve(res)
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        if (payload.data) {
                            let proto = UserStatus.deserialize(payload.data);
                            let data = this.buildDeviceStatus(proto);
                            res.push(data)
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
     * 获取我的通知信息
     * @param type 消息类型
     * @param page
     * @param pageSize
     */
    public getNoticeMessage(type:IOIMessageLabel,page: number = 1,pageSize: number = 40): Promise<Array<IOIMessage>> {
        return new Promise<any>(async (resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            this.client!!.meta.page = page;
            this.client!!.meta.pageSize = pageSize;
            let label = type.toString()
            if (type == "notify") {
                label = 'cc';
            }
            if (type == "quietly") {
                label = 'bcc';
            }
            const param = new Message({
                meta: this.client!!.meta,
                roomId: this.client!!.meta.roomId,
                label: label
            });
            let res : Array<IOIMessage>  = [];
            this.client!!.socket?.requestStream({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('message.notice.page')
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
     * 更新我的信息
     * @param nickname
     * @param avatar
     * @param mobile
     * @param email
     */
    public updateUserInfo(nickname: string = '', avatar: string = '',mobile: string = '',email: string = '',): Promise<string> {
        return new Promise<any>((resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            const param = new Users({
                meta: this.client!!.meta,
                nickname: nickname,
                avatar: avatar
            });
            let res : Object | null = null;
            this.client!!.socket?.requestResponse({
                data: Buffer.from(param.serializeBinary().buffer),
                metadata: this.buildRoute('user.update.info')
            }, {
                onComplete: () => {
                    resolve('')
                }, onNext: (payload: Payload, isComplete: boolean) => {
                    try {
                        // if (payload.data) {
                        //     let proto = Contacts.deserialize(payload.data);
                        //     let data = this.buildContact(proto);
                        //     res = data;
                        // }
                        if (isComplete) {
                            resolve('')
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