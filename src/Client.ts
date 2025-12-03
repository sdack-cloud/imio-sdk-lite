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
import {decryptAES} from "./utils/encrypt";

// =======
import {only as MetaPB} from "./protocol/Meta";
import {only as ConnectPB} from "./protocol/Connect";
import {only as ContactPB} from "./protocol/Contacts";
import {only as ContactStatusPB} from "./protocol/ContactStatus";
import {only as MessagePB} from "./protocol/Message";
import {only as GatewayPB} from "./protocol/Gateway";
import Meta = MetaPB.Meta;
import Connect = ConnectPB.Connect;
import ContactStatus = ContactStatusPB.ContactStatus;
import Contacts = ContactPB.Contacts;
import Message = MessagePB.Message;
import Gateway = GatewayPB.Gateway;
import {IMIOHostNode} from "./entity/HostNode";
import {IMIOContactStatus} from "./entity/Contact";
import {IMIODeviceStatus} from "./entity/Status";
import {IMIOTeamListener} from "./listener/TeamListener";
import {post} from "axios";


export class IMIOClient extends IMIOBase {

    // ========= 单例模式 =========
    private static instance: IMIOClient;

    private constructor() {
        super();
        this.getIP1();
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
                // console.log("Buffer Text:", str)
            } catch (e) {
                // console.error("浏览器环境不支持 Buffer")
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
        if (option.isWss) {
            this.protocol = "wss"
        }
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

    private protocol = "ws";

    private hostAddress = ""; // 当前决策的链接地址

    private readonly hostNodeList: Array<IMIOHostNode> = [];

    protected option ?: IMIOClientOption;

    public clientListener ?: IMIOClientListener

    public connectStatus: IMIOClientConnectStatus = IMIOClientConnectStatus.DONE // 连接中的状态

    private retryTimer: NodeJS.Timeout | number = -2; // 重试连接 定时器

    private connectStatusTimer: NodeJS.Timeout | number = -2; // 创建连接中的定时器

    private retryConnectNum: number = 0;// 重试连接次数

    private unexpectedly: number = 0;// 意外关闭次数

    readonly messageListener: Array<Partial<IMIOMessageListener>> = []

    readonly contactListener: Array<Partial<IMIOContactListener>> = []

    readonly teamListener: Array<Partial<IMIOTeamListener>> = []

    public setToken(token: string): IMIOClient {
        this.token = token;
        try {
            let payload = this.getJwtPayload(token);
            this.tokenAppId = Number(payload.aud)
            if ((this.tokenAppId + "" != this.option?.appId)) {
                if (this.option?.debug) {
                    console.warn("IO：token中的AppId 与 IMIOClientOption不一致")
                }
            }
            if (this.account) {
                if (this.isClose() && this.retryTimer < 0 ) {
                    this.callSocket(Number(this.account!.accountId))
                }
            }
        } catch (e) {
            this.tokenAppId = 0;
            if (this.option?.debug) {
                console.warn("IO: token中的AppId 解析错误")
            }
        }
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

    public getUserInfo(): Object | null {
        return this.account
    }

    /**
     * 会过滤引用相等的
     * @param listener
     */
    public addMessageListener(listener: Partial<IMIOMessageListener>) {
        let index = this.messageListener.findIndex(it => it === listener);
        if (index == -1) {
            this.messageListener.push(listener)
        }
    }

    public removeMessageListener(listener: Partial<IMIOMessageListener>) {
        let indexs = this.messageListener.filter(it => it === listener).map((_, index) => index);
        if (indexs.length > 0) {
            for (let index of indexs) {
                this.messageListener.splice(index, 1)
            }
        }
    }

    /**
     * 会过滤引用相等的
     * @param listener
     */
    public addTeamListener(listener: Partial<IMIOTeamListener>) {
        let index = this.teamListener.findIndex(it => it === listener);
        if (index == -1) {
            this.teamListener.push(listener)
        }
    }

    public removeTeamListener(listener: Partial<IMIOTeamListener>) {
        let indexs = this.teamListener.filter(it => it === listener).map((_, index) => index);
        if (indexs.length > 0) {
            for (let index of indexs) {
                this.teamListener.splice(index, 1)
            }
        }
    }

    /**
     * 会过滤引用相等的
     * @param listener
     */
    public addContactListener(listener: Partial<IMIOContactListener>) {
        let index = this.contactListener.findIndex(it => it === listener);
        if (index == -1) {
            this.contactListener.push(listener)
        }
    }

    public removeContactListener(listener: Partial<IMIOContactListener>) {
        let indexs = this.contactListener.filter(it => it === listener).map((_, index) => index);
        if (indexs.length > 0) {
            for (let index of indexs) {
                this.contactListener.splice(index, 1)
            }
        }
    }

    public disconnect(): IMIOClient {
        this.account = null;
        clearInterval(this.retryTimer);
        this.unexpectedly = 0;
        this.connectStatus = IMIOClientConnectStatus.DONE;
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
            throw new Error("IO 连接 token 必须")
        }
        if (clientListener) {
            this.clientListener = clientListener;
        }
        this.token = token;
        if (!this.option) {
            throw new Error("IOClientOption 缺失")
        }
        try {
            let payload = this.getJwtPayload(token);
            this.tokenAppId = Number(payload.aud)
        } catch (e) {
            this.tokenAppId = 0;
        }
        if (this.tokenAppId == 0 || (this.tokenAppId + '' != this.option?.appId)) {
            throw new Error("token中的AppId 与 IMIOClientOption不一致")
        }
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


    private callSocket(accountId: number = 0): void {
        if (!this.option) {
            throw new Error("客户端配置项不存在")
        }
        // if (address.length > 0)  {
        //     this.hostAddress = address;
        // } else {
        // }
        this.hostAddress = this.hostAddressProvider();
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
        // 获取ip地址
        try {
            if (this.ip.length <= 6) {
                this.getIP1();
            }
        } catch (e) {
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
            ip: this.ip + '',
            country: this.country + '',
            city: this.city + ''
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
            console.warn("IO host", this.hostAddress);
        }
        // let clientTransport = new TcpClientTransport({
        //     connectionOptions: {
        //         host: this.hostAddress,
        //         port: 8000,
        //     },
        // });
        let clientTransport = new WebsocketClientTransport({
            debug: true,
            url: `${this.protocol}://${this.hostAddress}/ws`,
        });
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
            transport: clientTransport,
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
                        console.warn("IO fireAndForget...", route);
                    }
                    this.routerParse(route, payloadData)

                    return {
                        cancel() {
                            // console.warn("IO responder cancel ");
                        }
                    }
                },
                requestResponse: (payload: Payload, responderStream: OnTerminalSubscriber & OnNextSubscriber & OnExtensionSubscriber): Cancellable & OnExtensionSubscriber => {

                    const meta = payload.metadata;
                    const payloadData = payload.data;
                    responderStream.onNext({data: Buffer.from("OK")}, true);
                    let route = "";
                    if (meta) {
                        let metadataMap = this.decodeMetadata(meta);
                        route = metadataMap.get("route");
                    }
                    if (this.option?.debug) {
                        console.warn("IO requestResponse...", route);
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
            try {
                if (this.connectStatus == IMIOClientConnectStatus.SUCCESS
                    || this.connectStatus == IMIOClientConnectStatus.SUCCESS_PULL) {
                    this.ping()
                }
            } catch (e) {
            }
        }, 2 * 1000);
        connector.connect()
            .then((res) => {
                if (this.option?.debug) {
                    console.warn("IO connect success...")
                }
                if (this.account) {
                    this.account.status = IMIOContactStatus.online
                }
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
                    if (this.option?.debug) {
                        console.error("IOServer connect onClose", message)
                    }
                    if (this.account) {
                        this.account.status = IMIOContactStatus.done
                    }
                    this.connectErrorEvent(message)
                });
            })
            .catch(err => {
                if (this.option?.debug) {
                    console.error("IOServer Connect Error", err);
                }
                if (err) {
                    let message = err?.message + "";
                    this.connectErrorEvent(message);
                } else { //undefined
                    if (this.account) {
                        this.account.status = IMIOContactStatus.done
                    }
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
                if (this.option?.debug) {
                    console.warn("IO connect finally");
                }
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
        if (!this.socket) {
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
        if (this.account) {
            this.account.status = IMIOContactStatus.done
        }
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
        if (eventMessage.indexOf("token") > -1) {
            try {
                this.connectStatus = IMIOClientConnectStatus.TOKEN_EXPIRED;
                this.clientListener?.onTokenExpired();
                this.clientListener?.onConnectStatus(this.connectStatus, this.retryConnectNum);
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
            if (this.retryConnectNum > 8) {
                clearInterval(this.retryTimer);
                this.retryConnectNum = 0;
                try {
                    this.connectStatus = IMIOClientConnectStatus.ERROR;
                    this.clientListener?.onConnectStatus(this.connectStatus, this.retryConnectNum);
                    this.clientListener?.onDisconnected()
                } catch (e) {
                }
                return
            }
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
     * 地址决策
     * @private
     */
    private hostAddressProvider(): string {
        if (this.option && this.option?.host) {
            let hosts = this.option!!.host.split(":");
            let index = this.hostNodeList.findIndex(it => it.host == hosts[0]);
            if (index == -1) {
                let hostNode = new IMIOHostNode();
                hostNode.host = hosts[0];
                if (hosts.length > 1) {
                    hostNode.port = hostNode[1];
                }
                this.hostNodeList.push(hostNode);
            }
        }
        if (this.hostNodeList.length == 1) {
            let hostNode1 = this.hostNodeList[0];
            let host = hostNode1.host;
            if (hostNode1.port.length) {
                host = host+":"+hostNode1.port
            }
            return host
        } else if (this.hostNodeList.length > 1) {
            let sortedArr = this.hostNodeList.sort((a,b) =>
                (b.max - b.current) - (a.max - a.current))
            let hostNode1 = sortedArr[0];
            let host = hostNode1.host;
            if (hostNode1.port.length) {
                host = host+":"+hostNode1.port
            }
            return host
        }

        return ''
    }

    private routerParse(route: string, payloadData: Buffer | null | undefined) {
        switch (route) {
            case 'link-to-many': // 切换接入点
                this.handleToMany(payloadData)
                break;
            case 'shutdown': // 强制剔出
                this.handleShutdown(payloadData)
                break;
            case 'gateway': // 切换接入点
                this.handleGateway(payloadData)
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
            case 'message-team':
                this.handleMessageTeam(payloadData);
                break;
        }
    }

    private handleShutdown(payloadData: Buffer | null | undefined) {
        if (!payloadData) {
            return;
        }
        try {
            this.clientListener?.onShutdown()
        } catch (e) {

        }
    }

    private handleGateway(payloadData: Buffer | null | undefined) {
        if (!payloadData) {
            return;
        }
        try {
            let data = Gateway.deserialize(payloadData);
            let hostNode = this.buildGateway(data);
            let s = this.deviceId.substring(0,16);
            let host = decryptAES(hostNode.host,s,s);
            hostNode.host = host;
            let find = this.hostNodeList.find(it => it.host == host);
            if (!find) {
                this.hostNodeList.push(hostNode);
            } else {
                find.current = hostNode.current
            }
        } catch (e) {

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
        try {
            let s = this.deviceId.substring(0,16);
            let ipAddr = decryptAES(pongData.ip,s,s);
            this.hostAddress = ipAddr
            let ips = ipAddr.split(':');
            let hostNode = new IMIOHostNode();
            hostNode.max = pongData.appId;
            hostNode.current = pongData.roomId;
            hostNode.name = pongData.nickname;
            if (ips.length > 1) {
                hostNode.host = ips[0];
                hostNode.port = ips[1];
            } else {
                hostNode.host = ipAddr;
            }
            let find = this.hostNodeList.find(it => it.name == hostNode.name);
            if (find) {
                find.max = hostNode.max;
                find.current = hostNode.current;
                find.host = hostNode.host;
                find.port = hostNode.port;
            } else {
                this.hostNodeList.push(hostNode)
            }
        } catch (e) {
        }
        this.option?.whitHost(pongData.ip);
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
                console.warn("IO meta", this.meta.toObject());
                console.warn("IO userinfo", this.account);
            }
        } catch (e) {
        }
    }

    private handleContact(payloadData: Buffer | null | undefined) {
        if (!payloadData) {
            return;
        }
        try {
            let deserialize = Contacts.deserialize(payloadData);
            let data = this.buildContact(deserialize);
            let findIndex = this.contactList.findIndex(it => it.contactId == data.contactId);
            if (findIndex > -1) {
                this.contactList[findIndex] = data;
            } else {
                this.contactList.push(data);
            }
        } catch (e) {
        }
    }

    private handleContactStatus(payloadData: Buffer | null | undefined) {
        if (!payloadData) {
            return;
        }
        try {
            let deserialize = Message.deserialize(payloadData);
            let findIndex = this.contactList.findIndex(it => !it.isGroup && it.userId == deserialize.fromId);
            if (findIndex > -1) {
                let status = IMIOContactStatus.done
                if (deserialize.command == IMIOContactStatus.offline) {
                    status = IMIOContactStatus.offline
                }
                if (deserialize.command == IMIOContactStatus.online) {
                    status = IMIOContactStatus.online
                }
                if (deserialize.command == IMIOContactStatus.online_busy) {
                    status = IMIOContactStatus.online_busy
                }
                if (deserialize.command == IMIOContactStatus.online_leave) {
                    status = IMIOContactStatus.online_leave
                }
                this.contactList[findIndex].status = status;
                if (this.account && this.account!!.accountId.length > 0 && deserialize.fromId == this.account!!.accountId) {
                    this.account!!.status = deserialize.command;
                }
                for (const listener of this.contactListener) {
                    try {
                        listener.onContactChange?.(false, this.contactList[findIndex]);
                    } catch (e) {
                    }
                }
            }
        } catch (e) {
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
                        this.contactList.splice(findIndex, 1, res)
                        for (const listener of this.contactListener) {
                            try {
                                listener.onContactChange?.(false, res);
                            } catch (e) {
                            }
                        }
                    }
                })
            }
        } catch (e) {
        }
    }

    private handleNotice(payloadData: Buffer | null | undefined) {
        if (!payloadData) {
            return;
        }
        try {
            let deserialize = Message.deserialize(payloadData);
            let message = this.buildMessage(deserialize);
            for (const listener of this.messageListener) {
                try {
                    listener.onNotice?.(message);
                } catch (_) {
                }
            }
        } catch (e) {
        }
    }

    private handleMessage(payloadData: Buffer | null | undefined) {
        if (!payloadData) {
            return;
        }
        try {
            let deserialize = Message.deserialize(payloadData);
            let message = this.buildMessage(deserialize);
            try {
                let chatManager = IMIOChatManager.getInstance().setClient(this);
                chatManager.signMessage(message.messageId, message.joinId).then()
            } catch (_) {
            }
            for (const listener of this.messageListener) {
                try {
                    listener.onMessage?.(message);
                } catch (_) {
                }
            }
        } catch (e) {
        }
    }

    private handleMessageTeam(payloadData: Buffer | null | undefined) {
        if (!payloadData) {
            return;
        }
        try {
            let deserialize = Message.deserialize(payloadData);
            let message = this.buildMessage(deserialize);
            for (const listener of this.teamListener) {
                try {
                    listener.onMessage?.(message);
                } catch (_) {
                }
            }
        } catch (e) {
        }
    }


}