import {IMIOClient} from "../Client";
import {Payload} from "rsocket-core";
import {IMIOBaseManager} from "./BaseManager";
import {IMIOMember} from "../entity/Member";
import {IMIOGroup, IMIOGroupType} from "../entity/Group";
import {IMIOContactManager} from "./ContactManager";
import {IMIOContact} from "../entity/Contact";
import {IMIOMessage, IMIOMessageLabel} from "../entity/Message";

//  ======
import {onlyour as ContactPB} from "../protocol/Contacts";
import {onlyour as RoomPB} from "../protocol/Rooms";
import {onlyour as UserPB} from "../protocol/Users";
import Users = UserPB.imio.Users;
import {onlyour as MessagePB} from "../protocol/Message";
import Message = MessagePB.imio.Message;


export class IMIOUserInfoManager extends IMIOBaseManager{
// ========= 单例模式 =========
    private static instance: IMIOUserInfoManager;

    public imioClient: IMIOClient | null = null;

    private constructor() {
        super();
    }

    public static getInstance(): IMIOUserInfoManager {
        if (!IMIOUserInfoManager.instance) {
            IMIOUserInfoManager.instance = new IMIOUserInfoManager();
        }
        return IMIOUserInfoManager.instance;
    }

    public setIMIOClient(client : IMIOClient) : IMIOUserInfoManager{
        this.imioClient = client
        return this
    }
    // ========= 单例模式 END =========

    /**
     * 获取我的通知信息
     * @param type 消息类型
     * @param page
     * @param pageSize
     */
    public getNoticeMessage(type:IMIOMessageLabel,page: number = 1,pageSize: number = 40): Promise<Array<IMIOMessage>> {
        return new Promise<any>(async (resolve, reject) => {
            if (this.checkSocket().length) {
                reject(new Error(this.checkSocket()))
                return;
            }
            this.imioClient!!.meta.page = page;
            this.imioClient!!.meta.pageSize = pageSize;
            let label = type.toString()
            if (type == "notify") {
                label = 'cc';
            }
            if (type == "quietly") {
                label = 'bcc';
            }
            const param = new Message({
                meta: this.imioClient!!.meta,
                roomId: this.imioClient!!.meta.roomId,
                label: label
            });
            let res : Array<IMIOMessage>  = [];
            this.imioClient!!.socket?.requestStream({
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
                meta: this.imioClient!!.meta,
                nickname: nickname,
                avatar: avatar
            });
            let res : Object | null = null;
            this.imioClient!!.socket?.requestResponse({
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
        return ''
    }

}