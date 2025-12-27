import {RSocket} from "rsocket-core";

import {
    decodeCompositeMetadata,
    encodeCompositeMetadata,
    encodeRoute,
    ExplicitMimeTimeEntry,
    WellKnownMimeType
} from "rsocket-composite-metadata";
import {IOIMessage, IOIMessageLabel, IOIMessageTalk} from "./entity/Message";
import {IOIAccountUser} from "./entity/AccountUser";
import {IOIContact, IOIContactStatus} from "./entity/Contact";
import {IOIMember} from "./entity/Member";
import {IOIHostNode} from "./entity/HostNode";
import {IOIDeviceStatus} from "./entity/Status";
import {IOIGroup, IOIGroupType} from "./entity/Group";
import axios, {Axios, AxiosInstance} from "axios";
// =======
import {only as MetaPB} from "./protocol/Meta";
import {only as ContactPB} from "./protocol/Contacts";
import {only as RoomPB} from "./protocol/Rooms";
import {only as TeamPB} from "./protocol/Teams";
import {only as TeamContactPB} from "./protocol/TeamContact";
import {only as MessagePB} from "./protocol/Message";
import {only as GatewayPB} from "./protocol/Gateway";
import {only as UserStatusPB} from "./protocol/UserStatus";
import {IOITeam} from "./entity/Team";


export class IOIBase {

    protected static _version = 1.0

    public token = ""; // token
    protected tokenAppId = 0;
    public pageSize = 300;
    protected account : IOIAccountUser | null = null; // 这里为 null 是为了，切换用户后重新赋值
    protected deviceId = ""; // 浏览器指纹码
    protected deviceName = ""; //浏览器设备
    protected deviceModel = ""; //浏览器设备
    protected ip: string = "";
    protected country: string = "";
    protected city: string = "";

    public getTokenAppId(): number {
        return this.tokenAppId;
    }
    public readonly meta: MetaPB.Meta =  new MetaPB.Meta({
        v: IOIBase._version,
        deviceTag: 'h5',
        page: 0, pageSize: 30
    });

    protected axios ?: AxiosInstance = axios.create({
        timeout: 5 * 1000
    })

    public socket?: RSocket | null;

    public readonly contactList:Array<IOIContact> = [];

    protected getIP1() {
        axios.get("https://api.ipbase.com/v1/json/").then(res => {

            let data = res.data;
            if (res.status == 200 && data.ip) {
                    this.ip = data?.ip;
                    this.country = data?.country_name;
                    this.city = (data?.region_name)+'-'+data?.city;
            } else {
                this.getIP3()
            }
        }).catch(err => {
            this.getIP3()
        })
    }
    protected getIP3() {
        axios.get("https://ipinfo.io/json").then(res => {

            let data = res.data;
            if (res.status == 200 && data.ip) {
                    this.ip = data?.ip;
                    this.country = data?.country;
                    this.city = (data?.region) +'-'+ (data?.city);
            } else {

            }
        }).catch(err => {

        })
    }


    protected getJwtPayload(token: string): any {
        // 分割JWT的三个部分
        const parts = token.split('.');
        // 解码JWT的第二部分（负载部分）
        const payload = parts[1];
        // 将Base64编码的负载解码回正常字符串
        const decodedPayload = atob(payload);
        // 解析为JSON对象
        return JSON.parse(decodedPayload);
    }


    protected decodeMetadata(buffer: Buffer): Map<string, any> {
        const map: Map<string, any> = new Map();
        try {
            const decodedCompositeMetaData = decodeCompositeMetadata(buffer);
            for (let metaData of decodedCompositeMetaData) {
                if (metaData) {
                    const entry = metaData as ExplicitMimeTimeEntry;
                    if (entry.type == WellKnownMimeType.MESSAGE_RSOCKET_ROUTING.toString()) {
                        map.set("route", entry.content.toString());
                    }
                    if (metaData.mimeType == WellKnownMimeType.MESSAGE_RSOCKET_ROUTING.toString()) {
                        map.set("route", entry.content.toString());
                    }
                }
            }

        } catch (e) {
        }
        return map;
    }

    protected buildRoute(routeName: string): Buffer {
        let route = encodeRoute(routeName);
        let compositeMetaData = encodeCompositeMetadata([
            [WellKnownMimeType.MESSAGE_RSOCKET_ROUTING, route],
            /*[WellKnownMimeType.MESSAGE_RSOCKET_AUTHENTICATION, encodeBearerAuthMetadata(this.token)]*/
        ]);
        return compositeMetaData;
    }

    protected buildDeviceStatus(proto: UserStatusPB.UserStatus) : IOIDeviceStatus {
        let data = new IOIDeviceStatus();
        data.deviceTag = proto.deviceTag;
        data.deviceId = proto.device;
        data.deviceKey = proto.deviceKey;
        data.status = proto.status;
        data.region = proto.region;
        data.gateway = proto.gateway;
        data.joinId = proto.roomId;
        data.userId = proto.userId;
        return data;
    }


    protected buildGateway(proto: GatewayPB.Gateway) : IOIHostNode {
        let data = new IOIHostNode();
        if (proto.ip == 4) {
            data.type = true;
        } else {
            data.type = false;
        }
        data.name = proto.name
        data.host = proto.host
        data.max = proto.max
        data.port = proto.port
        data.region = proto.remark
        data.current = proto.sort
        return data;
    }
    protected buildContact(proto: ContactPB.Contacts): IOIContact {
        let data = new IOIContact();
        data.contactId = proto.id
        data.joinId = proto.joinRoomId;
        data.userId = proto.userId;
        data.nickname = proto.nickname;
        data.username = proto.username;
        data.subgroup = proto.subgroup;
        data.avatar = proto.avatar;
        data.isGroup = proto.talkMode == 2;
        data.joinTime = proto.joinTime;
        data.isMuted = proto.muted == 1;
        data.noise = proto.noise;
        data.sort = proto.sort;
        if (proto.status == IOIContactStatus.offline) {
            data.status = IOIContactStatus.offline;
        }
        if (proto.status == IOIContactStatus.online) {
            data.status = IOIContactStatus.online;
        }
        if (proto.status == IOIContactStatus.online_busy) {
            data.status = IOIContactStatus.online_busy;
        }
        if (proto.status == IOIContactStatus.online_leave) {
            data.status = IOIContactStatus.online_leave;
        }
        return data;
    }

    protected buildMember(proto: ContactPB.Contacts): IOIMember {
        let data = new IOIMember();
        data.memberId = proto.id
        data.joinId = proto.joinRoomId;
        data.userId = proto.userId;
        data.nickname = proto.nickname;
        data.username = proto.username;
        data.avatar = proto.avatar;
        data.status = proto.status;
        data.joinTime = proto.joinTime;
        data.isMuted = proto.muted == 1;
        data.role = proto.role;
        // data.isGroup = proto.talkMode == 2;
        return data;
    }

    protected buildGroup(proto: RoomPB.Rooms): IOIGroup {
        let data = new IOIGroup();
        data.groupId = proto.id;
        data.joinId = proto.id;
        data.groupName = proto.roomname
        data.groupNumber = proto.account;
        data.userId = proto.userId;
        data.avatar = proto.avatar;
        data.depict = proto.depict;
        data.isTalk = proto.groupToOne == 1;
        data.isApproval = proto.applyJoin == 1;
        data.isInviteApply = proto.applyNeed == 1;
        data.isInvite = proto.invite == 1;
        data.maxMember = proto.roomMax;
        data.isGroup = proto.talkMode == 2;
        data.isMute = proto.muted == 1;
        data.isRevoke = proto.revoke == 1;
        data.ask = proto.ask;
        switch (proto.type) {
            case 'protected':
                data.type = IOIGroupType.protected;
                break;
            case 'public':
                data.type = IOIGroupType.public;
                break;
            case 'private':
                data.type = IOIGroupType.private;
                break;
        }

        return data;
    }

    protected buildTeamMember(proto: TeamContactPB.TeamContact): IOIMember {
        let data = new IOIMember();
        data.memberId = proto.id
        data.joinId = proto.joinTeamId;
        data.userId = proto.userId+"";
        data.nickname = proto.nickname;
        data.username = proto.username;
        data.avatar = proto.avatar;
        // data.status = proto.status;
        data.joinTime = proto.joinTime;
        data.isMuted = proto.muted == 1;
        data.role = proto.role;
        // data.isGroup = proto.talkMode == 2;
        return data;
    }

    protected buildTeam(proto: TeamPB.Teams): IOITeam {
        let data = new IOITeam();
        data.teamId = proto.id;
        data.teamName = proto.teamname
        data.teamNumber = proto.account;
        data.userId = proto.userId;
        data.avatar = proto.avatar;
        data.isMute = proto.muted == 1;
        return data;
    }

    protected buildMessage(proto: MessagePB.Message) : IOIMessage {
        let ioMessage = new IOIMessage();
        ioMessage.messageId = proto.messageId;
        ioMessage.msgId = proto.msgId;
        ioMessage.joinId = proto.roomId;
        ioMessage.tag = proto.tag;
        ioMessage.fromId = proto.fromId;
        ioMessage.fromName = proto.fromName;
        ioMessage.destId = proto.destId;
        ioMessage.destName = proto.destName;
        ioMessage.cite = proto.cite;
        ioMessage.type = this.subtype(proto.subtype);
        ioMessage.title = proto.title;
        ioMessage.subtitle = proto.subtitle;
        ioMessage.text = proto.text;
        ioMessage.secret = proto.secret;
        ioMessage.thumb = proto.thumb;
        ioMessage.host = proto.host;
        ioMessage.url = proto.url;
        ioMessage.lng = proto.lng;
        ioMessage.lat = proto.lat;
        ioMessage.size = proto.size;
        ioMessage.length = proto.length;
        ioMessage.sent = proto.sent;
        ioMessage.deviceKey = proto.deviceKey;
        ioMessage.deviceTag = proto.deviceTag;
        ioMessage.avatar = proto.avatar;
        ioMessage.sentDate = new Date(proto.sent);
        ioMessage.revoke = proto.revoke.length != 0;

        switch (proto.talkMode) {
            case 1:
                ioMessage.talk = IOIMessageTalk.default;
                break;
            case 2:
                ioMessage.talk = IOIMessageTalk.group;
                break;
            case 3:
                ioMessage.talk = IOIMessageTalk.team;
                break;
        }

        switch (proto.label) {
            case 'tip':
                ioMessage.label = IOIMessageLabel.tip;
                break;
            case 'notice':
                ioMessage.label = IOIMessageLabel.notice;
                break;
            case 'action':
                ioMessage.label = IOIMessageLabel.action;
                break;
            case 'cc':
                ioMessage.label = IOIMessageLabel.notify;
                break;
            case 'bcc':
                ioMessage.label = IOIMessageLabel.quietly;
                break;
        }

        if (proto.citeData) {
            ioMessage.citeData = this.buildMessage(proto.citeData)
        }
        if (proto.remind && proto.remind.length) {
            ioMessage.hintList = [];
            for (let item of proto.remind) {
                let ioMessage1 = new IOIMessage();
                ioMessage1.fromId = item.fromId;
                ioMessage1.destId = item.destId;
                ioMessage1.destName = item.nickname
                ioMessage1.joinId = item.roomId
                ioMessage.hintList.push(ioMessage1);
            }
        }
        if (proto.cc && proto.cc.length) {
            ioMessage.notifyList = [];
            ioMessage.quietlyList = [];
            for (let item of proto.cc) {
                let ioMessage1 = new IOIMessage();
                ioMessage1.fromId = item.fromId;
                ioMessage1.destId = item.destId;
                ioMessage1.destName = item.nickname
                ioMessage1.joinId = item.roomId
                if (item.sort == 0) {
                    ioMessage.notifyList.push(ioMessage1);
                } else {
                    ioMessage.quietlyList.push(ioMessage1);
                }
            }
        }
        return ioMessage;
    }

    private subtype(d: number):string {
        switch (d) {
            case 1:
                return 'txt';
                case 2:
                return 'img';
                case 3:
                return 'audio';
                case 4:
                return 'video';
                case 5:
                return 'file';
                case 6:
                return 'loc';
                case 7:
                return 'custom';
                case 9:
                return 'wallet';
        }
        return ''
    }
}