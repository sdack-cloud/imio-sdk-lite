import {IMIOClientOption} from "./Option";
import {
    Cancellable,
    OnExtensionSubscriber,
    OnNextSubscriber,
    OnTerminalSubscriber,
    Payload,
    RSocketConnector
} from "rsocket-core";
import {WebsocketClientTransport} from "rsocket-websocket-client";

import {encodeBearerAuthMetadata, encodeCompositeMetadata, WellKnownMimeType} from "rsocket-composite-metadata";
import {IMIOBase} from "./Base";
import {IMIOClientConnectStatus, IMIOClientListener} from "./listener/ClientListener";
import {IMIOMessageListener} from "./listener/MessageListener";
import {IMIOContactListener} from "./listener/ContactListener";
import {IMIOAccountUser} from "./entity/AccountUser";
import {IMIOChatManager} from "./manager/ChatManager";
import {IMIOContactManager} from "./manager/ContactManager";
import fp from '@fingerprintjs/fingerprintjs';

// =======
import {onlyour as MetaPB} from "./protocol/Meta";
import {onlyour as ConnectPB} from "./protocol/Connect";
import {onlyour as ContactPB} from "./protocol/Contacts";
import {onlyour as ContactStatusPB} from "./protocol/ContactStatus";
import {onlyour as MessagePB} from "./protocol/Message";
import Meta = MetaPB.imio.Meta;
import Connect = ConnectPB.imio.Connect;
import ContactStatus = ContactStatusPB.imio.ContactStatus;
import Contacts = ContactPB.imio.Contacts;
import Message = MessagePB.imio.Message;

export class IMIOClient extends IMIOBase {

    // ========= 单例模式 =========
    private static instance: IMIOClient;

    private constructor() {
        super();
    }

    public static getInstance(): IMIOClient {
        if (!IMIOClient.instance) {
            IMIOClient.instance = new IMIOClient();
            fp.load().then(it => it.get())
                .then(res => {
                    IMIOClient.instance.deviceId = res.visitorId;
                    // this._instance.meta?.appId = Number(option.appId);
                });
            try {
                const buffer: Buffer = Buffer.from("Buffer 支持度测试文本");
                const str: string = buffer.toString();
                // console.log("Buffer:", buffer)
                console.log("Buffer Text:", str)
            } catch (e) {
                console.error("浏览器环境不支持 Buffer")
            }
        }
        return IMIOClient.instance;
    }

    // ========= 单例模式 END =========

    public whitOption(option: IMIOClientOption): IMIOClient {

        if (!option) {
            throw new Error("初始化失败")
        }
        if (!option.appId.length) {
            throw new Error("初始化失败 appId")
        }
        // if (!option.issuer.length) {
        //     throw new Error("初始化失败 issuer")
        // }
        if (!option.host.length && !option.hosts.length) {
            throw new Error("接入点比选其一")
        }

        this.option = option;

        this.userAgent = window.navigator.userAgent;
        let n1 = window.navigator.userAgent.indexOf('(');
        let n2 = window.navigator.userAgent.indexOf(')');
        this.deviceName = window.navigator.userAgent.substring(n1 + 1, n2);
        let n3 = window.navigator.userAgent.lastIndexOf(')');
        this.deviceModel = window.navigator.userAgent.substring(n3 + 1);
        if (this.deviceModel.length > 200) {
            this.deviceModel = this.deviceModel.substring(0, 200)
        }
        if (this.deviceName.length > 150) {
            this.deviceName = this.deviceModel.substring(0, 150)
        }
        this.meta.appId = Number(option.appId);
        fp.load().then(it => it.get())
            .then(res => {
                this.deviceId = res.visitorId;
                this.meta.deviceKey = res.visitorId;
                // this._instance.meta?.appId = Number(option.appId);
                if (option?.debug) {
                    console.warn("Client init... " + res.visitorId);
                }
            });

        // 把客户端赋值给 window
        try {
            // window.imio = this._instance;
        } catch (e) {
        }
        return this;
    }

    private userAgent = "";

    private hostAddress = ""; // 当前决策的链接地址

    protected option ?: IMIOClientOption;

    public clientListener ?: IMIOClientListener

    public connectStatus: IMIOClientConnectStatus = IMIOClientConnectStatus.DONE // 连接中的状态

    private retryTimer: NodeJS.Timeout | number = -2; // 重试连接 定时器

    private connectStatusTimer: NodeJS.Timeout | number = -2; // 创建连接中的定时器

    private retryConnectNum: number = 0;// 重试连接次数

    private unexpectedly: number = 0;// 意外关闭次数

    readonly messageListener: Array<IMIOMessageListener> = []

    readonly contactListener: Array<IMIOContactListener> = []

    public setToken(token: string): IMIOClient {
        this.token = token;
        return this;
    }


    /**
     * 连接是否关闭
     * 关闭 true
     * 未关闭 false
     */
    public isClose(): boolean {
        if (!this.socket) {
            return true;
        }
        return false;
    }


    public getDeviceKey(): string {
        return this.deviceId;
    }

    public getUserInfo() : Object | null {
        return this.account
    }

    public disconnect(): IMIOClient {
        this.account = null;
        clearInterval(this.retryTimer);
        this.unexpectedly = 0;
        if (this.socket) {
            this.socket.close(new Error("主动关闭"))
            this.socket = null;
            if (this.option && this.option.appId.length) {
                this.meta.pageSize = this.pageSize;
                this.meta.page = 0;
                this.meta.appId = Number(this.option?.appId);
            }
        }
        return this;
    }

    /**
     * 创建连接
     * 通过连接创建一个用户
     *
     * @param accountId 用户唯一ID
     * @param token TOKEN
     * @param nickname 昵称
     * @param clientListener 客户端监听者
     */
    public connect(accountId: number, token: string, nickname: string,
                   clientListener?: IMIOClientListener): IMIOClient {

        if (!token || token.length < 50) {
            throw new Error("IMIO 连接 token 必须")
        }
        if (clientListener) {
            this.clientListener = clientListener;
        }
        this.token = token;
        if (this.option?.debug) {
            console.warn('connect deviceId', this.deviceId);
            if (!this.meta.deviceKey.length) {
                this.meta.deviceKey = this.deviceId;
            }
        }
        if (this.isClose()) { // 关闭的连接才能再次连接
            this.disconnect();
        }
        this.account = new IMIOAccountUser();
        this.account.nickname = nickname;
        if (accountId) {
            this.account.accountId = accountId.toString();
            this.meta.userId = this.account.accountId;
        }
        if (!this.deviceId.length) {
            setTimeout(() => {
                this.callSocket(accountId);
            }, 2000);
        } else {
            this.callSocket(accountId);
        }
        return this;
    }


    private callSocket(accountId: number = 0, address: string = ""): void {
        if (!this.option) {
            throw new Error("客户端配置项不存在")
        }
        if (address.length > 0)  {
            this.hostAddress = address;
        } else {
            this.hostAddress = this.hostProvider();
        }
        if (!this.hostAddress.length) {
            throw new Error("主机地址不存在")
        }
        let nickname1 = "";
        let phone = "";
        let email = "";
        if (!accountId) {
            if (this.account && this.account.nickname) {
                nickname1 = this.account.nickname.toString();
            }
            if (this.account && this.account.phone) {
                phone = this.account.phone.toString();
            }
            if (this.account && this.account.email) {
                email = this.account.email.toString();
            }
        }

        const connect = new Connect({
            appId: parseInt(this.option.appId),
            deviceKey: this.deviceId,
            prefix: 'h5',
            userId: accountId > 0 ? accountId.toString() : "",
            nickname: accountId > 0 ? nickname1 : "",
            email: accountId > 0 ? email : "",
            phone: accountId > 0 ? phone : "",
            deviceModel: this.deviceModel,
            deviceName: this.deviceName,
        });

        let metadata = null;
        try {
            metadata = encodeBearerAuthMetadata(this.token)
        } catch (e) {
            if (this.option?.debug) {
                console.error("Buffer Error", e)
            }
            return;
        }
        if (!metadata) {
            return;
        }
        if (this.option?.debug) {
            console.warn("IMIO host", this.hostAddress);
        }
        let connector = new RSocketConnector({
            setup: {
                keepAlive: 5 * 1000,
                // lifetime: 6000 * 1000, //存活时长 毫秒
                dataMimeType: WellKnownMimeType.APPLICATION_CBOR.string,
                metadataMimeType: WellKnownMimeType.MESSAGE_RSOCKET_COMPOSITE_METADATA.string,
                payload: {
                    data: Buffer.from(connect.serializeBinary().buffer),
                    metadata: encodeCompositeMetadata([
                        [WellKnownMimeType.MESSAGE_RSOCKET_AUTHENTICATION, encodeBearerAuthMetadata(this.token)]
                    ]),
                },
            },
            transport: new WebsocketClientTransport({
                debug: true,
                url: `ws://${this.hostAddress}`,
            }),
            responder: {
                fireAndForget: (payload: Payload, responderStream: OnTerminalSubscriber): Cancellable => {

                    const metaData = payload.metadata;
                    const payloadData = payload.data;
                    responderStream.onComplete(); //
                    let route = "";
                    if (metaData) {
                        let metadataMap = this.decodeMetadata(metaData);
                        route = metadataMap.get("route");
                    }
                    if (this.option?.debug) {
                        console.warn("IMIO fireAndForget...",route);
                    }
                    this.routerParse(route, payloadData)

                    return {
                        cancel() {
                            // console.warn("IMIO responder cancel ");
                        }
                    }
                },
                requestResponse: (payload: Payload, responderStream: OnTerminalSubscriber & OnNextSubscriber & OnExtensionSubscriber): Cancellable & OnExtensionSubscriber => {
                    console.warn("IMIO requestResponse...");

                    const meta = payload.metadata;
                    const payloadData = payload.data;
                    responderStream.onNext({data: Buffer.from("OK")}, true);
                    let route = "";
                    if (meta) {
                        let metadataMap = this.decodeMetadata(meta);
                        route = metadataMap.get("route");
                    }
                    if (this.option?.debug) {
                        console.warn("IMIO requestResponse...",route);
                    }
                    this.routerParse(route, payloadData)

                    return {
                        cancel() {
                        },
                        onExtension(extendedType: number, content: Buffer | null | undefined, canBeIgnored: boolean) {
                            // console.warn("onExtension....");
                        }
                    }
                }
            },

        });

        this.connectStatus = IMIOClientConnectStatus.CONNECTING
        // 发布连接状态
        this.connectStatusTimer = setInterval(() => {
            try {
                if (this.clientListener) {
                    this.clientListener.onConnectStatus(this.connectStatus, this.retryConnectNum)
                }
            } catch (e) {
            }
            try{
                if (this.connectStatus == IMIOClientConnectStatus.SUCCESS
                    || this.connectStatus == IMIOClientConnectStatus.SUCCESS_PULL) {
                    this.ping()
                }
            }catch (e) {
            }
        }, 2 * 1000);
        connector.connect()
            .then((res) => {
                // if (this.option?.debug) {
                console.warn("IMIO connect success...")
                // }
                try {
                    // clearInterval(intervalConnectStatus); //  收到 Pong 响应才 停止
                    this.connectStatus = IMIOClientConnectStatus.SUCCESS_PULL
                    this.clientListener?.onConnected();
                } catch (e) {
                }
                this.retryConnectNum = 0;
                this.unexpectedly = 0;
                this.socket = res;
                clearInterval(this.retryTimer);
                this.retryTimer = -2;
                // 监听服务器的关闭事件
                res.onClose(err => {
                    let message = err?.message + "";
                    // if (this.option?.debug) {
                    console.error("IMIOServer connect onClose", message)
                    // }
                    this.connectErrorEvent(message)
                });
            })
            .catch(err => {
                // if (this.option?.debug) {
                console.error("IMIOServer Connect Error", err);
                // }
                if (err) {
                    let message = err?.message + "";
                    this.connectErrorEvent(message);
                } else { //undefined
                    // 未知错误原因，尝试几次
                    if (this.unexpectedly > 6) { // 大于重试次数，停止连接
                        clearInterval(this.retryTimer);
                        clearInterval(this.connectStatusTimer);
                        this.socket = null;
                        this.connectStatus = IMIOClientConnectStatus.ERROR;
                        this.retryTimer = -2;
                        try {
                            this.clientListener?.onDisconnected();
                        } catch (e) {
                        }
                        return;
                    }
                    clearInterval(this.connectStatusTimer);
                    this.connectStatusTimer = -2;
                    this.unexpectedly++;
                    this.retryConnTimer()
                }
            })
            .finally(() => {
                console.warn("IMIO connect finally");
            })
        ;
    }

    public ping() {
        if (!this.option) {
            return;
        }
        if (!this.option!!.appId.length) {
            return;
        }
        if (!this.socket){
            return;
        }
        const connect = new Connect({
            appId: parseInt(this.option.appId),
            deviceKey: this.deviceId,
            prefix: 'h5',
            userId: this.account ? this.account!!.accountId.toString() : "",
            deviceModel: this.deviceModel,
            deviceName: this.deviceName,
        });
        this.socket?.requestResponse({
            data: Buffer.from(connect.serializeBinary().buffer),
            metadata: this.buildRoute('ping')
        }, {
            onComplete: () => {
            }, onNext: (payload: Payload, isComplete: boolean) => {
            }, onError: (error: Error) => {
            }, onExtension(extendedType: number, content: Buffer | null | undefined, canBeIgnored: boolean): void {
            }
        })
    }

    /**
     * 连接建立失败事件
     * @param eventMessage
     * @private
     */
    private connectErrorEvent(eventMessage: String) {
        this.socket = null;
        clearInterval(this.connectStatusTimer);
        this.connectStatusTimer = -2;
        // 是服务器错误引起的关闭，发起重试连接，定时器
        if (eventMessage.indexOf("主动关闭") > -1) { // 是主动关闭
            clearInterval(this.retryTimer);
            clearInterval(this.connectStatusTimer);
            this.connectStatus = IMIOClientConnectStatus.DONE;
            this.retryTimer = -2;
            this.connectStatusTimer = -2;
            this.retryConnectNum = 0;
            try {
                this.clientListener?.onDisconnected();
            } catch (e) {
            }
            return;
        }
        if (eventMessage.indexOf("keep-alive") > -1) { // 重连
            this.unexpectedly = 0;
            if (this.unexpectedly > 6) { // 大于重试次数，停止连接
                clearInterval(this.retryTimer);
                clearInterval(this.connectStatusTimer);
                this.connectStatus = IMIOClientConnectStatus.ERROR;
                this.connectStatusTimer = -2;
                this.retryTimer = -2;
                try {
                    this.clientListener?.onDisconnected();
                } catch (e) {
                }
                return;
            }
            this.unexpectedly++;
            this.retryConnTimer()
            return;
        }
        if (eventMessage.indexOf("unexpectedly") > -1) {
            // 服务器意外关闭，尝试几次后放弃，交给人员操作
            if (this.unexpectedly > 6) { // 大于重试次数，停止连接
                clearInterval(this.retryTimer);
                clearInterval(this.connectStatusTimer);
                this.connectStatus = IMIOClientConnectStatus.ERROR;
                this.connectStatusTimer = -2;
                this.retryTimer = -2;
                try {
                    this.clientListener?.onDisconnected();
                } catch (e) {
                }
                return;
            }
            this.unexpectedly++;
            this.retryConnTimer()
            return;
        }
        if (eventMessage.indexOf("Jwt") > -1) { // 因为凭证过期不会重连
            clearInterval(this.retryTimer);
            clearInterval(this.connectStatusTimer);
            this.connectStatusTimer = -2;
            this.retryTimer = -2;
            try {
                this.connectStatus = IMIOClientConnectStatus.TOKEN_EXPIRED;
                this.clientListener?.onConnectStatus(this.connectStatus, this.retryConnectNum);
            } catch (e) {
            }
            try {
                this.clientListener?.onTokenExpired();
            } catch (e) {
            }
            return;
        }

        if (eventMessage.indexOf("SQL") > -1 || eventMessage.indexOf('connect') > -1) {
            try {
                this.connectStatus = IMIOClientConnectStatus.ERROR;
                this.clientListener?.onConnectStatus(this.connectStatus, this.retryConnectNum);
            } catch (e) {
            }
            this.unexpectedly++;
            this.retryConnTimer()
            return;
        }
        if (eventMessage.indexOf("token cannot") > -1) {
            try {
                // this.clientListener?.onDisconnected(IMIOClientError.TOKEN_EMPTY.valueOf())
            } catch (e) {
            }
            return;
        }
        if (eventMessage.indexOf("token") > -1) {
            try {
                // this.clientListener?.onDisconnected(IMIOClientError.TOKEN_EXPIRE.valueOf())
            } catch (e) {
            }
            return;
        }

    }

    /**
     * 创建重试连接
     * @private
     */
    private retryConnTimer() {
        clearInterval(this.retryTimer);
        this.retryTimer = setInterval(() => {
            if (!this.socket) {
                this.retryConnectNum++;
                this.connectStatus = IMIOClientConnectStatus.RETRY_CONNECTING;
                try {
                    this.clientListener?.onConnectStatus(this.connectStatus, this.retryConnectNum);
                } catch (e) {
                }
                if (this.account) {
                    try {
                        let acID = Number(this.account.accountId);
                        this.callSocket(acID);
                    } catch (e) {
                    }
                } else {
                    this.callSocket();
                }
            }
        }, 8 * 1000);
    }

    /**
     *
     * @private
     */
    private hostProvider(): string {
        if (this.option && this.option?.host) {
            return this.option.host.toString()
        }
        return ''
    }

    private routerParse(route: string, payloadData: Buffer | null | undefined) {
        switch (route) {
            case 'link-to-many': // 切换接入点
                this.handleToMany(payloadData)
                break;
            case 'pong':
                clearInterval(this.connectStatusTimer)
                this.connectStatusTimer = -2;
                try {
                    this.connectStatus = IMIOClientConnectStatus.SUCCESS;
                    this.clientListener?.onConnectStatus(this.connectStatus, this.retryConnectNum);
                } catch (e) {
                }
                this.handelPong(payloadData);
                break;
            case 'contact':
                this.handleContact(payloadData);
                break;

            case 'contact-status':
                this.handleContactStatus(payloadData);
                break;
            case 'contact-change':
                this.handleContactChange(payloadData);
                break;
            case 'notice':
                this.handleNotice(payloadData);
                break;
            case 'message':
                this.handleMessage(payloadData);
                break;
        }
    }

    private handleToMany(payloadData: Buffer | null | undefined) {
        if (!payloadData) {
            return;
        }
        clearInterval(this.retryTimer);
        this.retryTimer = -2;
        try {
            this.connectStatus = IMIOClientConnectStatus.RETRY_CONNECTING;
            this.clientListener?.onConnectStatus(this.connectStatus, this.retryConnectNum);
        } catch (e) {
        }
        const pongData = Connect.deserialize(payloadData);
        this.hostAddress = pongData.email;
        this.option?.whitHost(pongData.email);
        if (this.socket) {
            this.socket?.close(new Error("主动关闭"))
            if (this.account) {
                this.callSocket(Number(this.account.accountId))
            }
        }
    }

    private handelPong(payloadData: Buffer | null | undefined) {
        if (!payloadData) {
            return;
        }

        try {
            const pongData = Connect.deserialize(payloadData);
            if (this.account) {
                this.account.accountId = pongData.userId;
                this.account.account = pongData.account;
                this.account.roomId = pongData.roomId;
                this.account.nickname = pongData.nickname;
                this.account.avatar = pongData.avatar;
                // this.account.status = 'online';
            }
            if (this.meta) {
                this.meta.roomId = pongData.roomId;
                this.meta.userId = pongData.userId;
                this.meta.nickname = pongData.nickname;
                this.meta.avatar = pongData.avatar;
            }
            if (this.option?.debug) {
                console.warn("IMIO meta", this.meta.toObject());
                console.warn("IMIO userinfo", this.account);
            }
        }catch (e) {
        }
    }

    private handleContact(payloadData: Buffer | null | undefined) {
        if (!payloadData) {
            return;
        }
        try {
            let deserialize = Contacts.deserialize(payloadData);
            let imioData = this.buildContact(deserialize);
            let findIndex = this.contactList.findIndex(it => it.contactId == imioData.contactId);
            if (findIndex > -1) {
                this.contactList[findIndex] = imioData;
            } else {
                this.contactList.push(imioData);
            }
        }catch (e) {
        }
    }

    private handleContactStatus(payloadData: Buffer | null | undefined) {
        if (!payloadData) {
            return;
        }
        try {
            let deserialize = Message.deserialize(payloadData);
            let findIndex = this.contactList.findIndex(it => !it.isGroup && it.userId == deserialize.destId);
            if (findIndex > -1) {
                this.contactList[findIndex].status = deserialize.command;
                if (this.account && this.account!!.accountId.length > 0 && deserialize.destId == this.account!!.accountId) {
                    this.account!!.status = deserialize.command;
                }
                for (const listener of this.contactListener) {
                    try {
                        listener.onContactChange(false, this.contactList[findIndex]);
                    } catch (e) {}
                }
            }
        }catch (e) {
        }
    }

    private handleContactChange(payloadData: Buffer | null | undefined) {
        if (!payloadData) {
            return;
        }
        try {
            let deserialize = Message.deserialize(payloadData);
            if (deserialize.text.length) {
                IMIOContactManager.getInstance().getContactByUserId(deserialize.text).then(res => {
                    let findIndex = this.contactList.findIndex(it => !it.isGroup && it.userId == res.userId);
                    if (findIndex > -1) {
                        this.contactList.splice(findIndex,1, res)
                        for (const listener of this.contactListener) {
                            try {
                                listener.onContactChange(false, res);
                            } catch (e) {}
                        }
                    }
                })
            }
        }catch (e) {
        }
    }

    private handleNotice(payloadData: Buffer | null | undefined) {
        if (!payloadData) {
            return;
        }
        try {
            let deserialize = Message.deserialize(payloadData);
            let imioMessage = this.buildMessage(deserialize);
            for (const listener of this.messageListener) {
                try {
                    listener.onNotice(imioMessage);
                }catch (_) {
                }
            }
        }catch (e) {
        }
    }

    private handleMessage(payloadData: Buffer | null | undefined) {
        if (!payloadData) {
            return;
        }
        try {
            let deserialize = Message.deserialize(payloadData);
            let imioMessage = this.buildMessage(deserialize);
            try {
                let chatManager = IMIOChatManager.getInstance().setIMIOClient(this);
                chatManager.signMessage(imioMessage.messageId,imioMessage.joinId).then()
            }catch (_) {
            }
            for (const listener of this.messageListener) {
                try {
                    listener.onMessage(imioMessage);
                }catch (_) {
                }
            }
        }catch (e) {
        }
    }




}