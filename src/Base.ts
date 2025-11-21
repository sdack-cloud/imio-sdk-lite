import {RSocket} from "rsocket-core";

import {
    decodeCompositeMetadata,
    encodeCompositeMetadata,
    encodeRoute,
    ExplicitMimeTimeEntry,
    WellKnownMimeType
} from "rsocket-composite-metadata";
import {IMIOMessage, IMIOMessageLabel, IMIOMessageTalk} from "./entity/Message";
import {IMIOAccountUser} from "./entity/AccountUser";
import {IMIOContact, IMIOContactStatus} from "./entity/Contact";
import {IMIOMember} from "./entity/Member";
import {IMIOHostNode} from "./entity/HostNode";
import {IMIODeviceStatus} from "./entity/Status";
import {IMIOGroup, IMIOGroupType} from "./entity/Group";
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
import {IMIOTeam} from "./entity/Team";


export class IMIOBase {

    protected static _version = 1.0

    public token = ""; // token
    protected tokenAppId = 0;
    public pageSize = 300;
    protected account : IMIOAccountUser | null = null; // 这里为 null 是为了，切换用户后重新赋值
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
        v: IMIOBase._version,
        deviceTag: 'h5',
        page: 0, pageSize: 30
    });

    protected axios ?: AxiosInstance = axios.create({
        timeout: 5 * 1000
    })

    public socket?: RSocket | null;

    public readonly contactList:Array<IMIOContact> = [];

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

    protected buildDeviceStatus(proto: UserStatusPB.UserStatus) : IMIODeviceStatus {
        let data = new IMIODeviceStatus();
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


    protected buildGateway(proto: GatewayPB.Gateway) : IMIOHostNode {
        let data = new IMIOHostNode();
        if (proto.ip == 4) {
            data.type = true;
            data.host = `${proto.one}.${proto.two}.${proto.three}.${proto.four}`
        } else {
            data.type = false;
            data.host = proto.host
        }
        data.max = proto.max
        data.port = proto.port
        data.region = proto.remark
        data.current = proto.sort
        return data;
    }
    protected buildContact(proto: ContactPB.Contacts): IMIOContact {
        let data = new IMIOContact();
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
        if (proto.status == IMIOContactStatus.offline) {
            data.status = IMIOContactStatus.offline;
        }
        if (proto.status == IMIOContactStatus.online) {
            data.status = IMIOContactStatus.online;
        }
        if (proto.status == IMIOContactStatus.online_busy) {
            data.status = IMIOContactStatus.online_busy;
        }
        if (proto.status == IMIOContactStatus.online_leave) {
            data.status = IMIOContactStatus.online_leave;
        }
        return data;
    }

    protected buildMember(proto: ContactPB.Contacts): IMIOMember {
        let data = new IMIOMember();
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

    protected buildGroup(proto: RoomPB.Rooms): IMIOGroup {
        let data = new IMIOGroup();
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
                data.type = IMIOGroupType.protected;
                break;
            case 'public':
                data.type = IMIOGroupType.public;
                break;
            case 'private':
                data.type = IMIOGroupType.private;
                break;
        }

        return data;
    }

    protected buildTeamMember(proto: TeamContactPB.TeamContact): IMIOMember {
        let data = new IMIOMember();
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

    protected buildTeam(proto: TeamPB.Teams): IMIOTeam {
        let data = new IMIOTeam();
        data.teamId = proto.id;
        data.teamName = proto.teamname
        data.teamNumber = proto.account;
        data.userId = proto.userId;
        data.avatar = proto.avatar;
        data.isMute = proto.muted == 1;
        return data;
    }

    protected buildMessage(proto: MessagePB.Message) : IMIOMessage {
        let imioMessage = new IMIOMessage();
        imioMessage.messageId = proto.messageId;
        imioMessage.joinId = proto.roomId;
        imioMessage.tag = proto.tag;
        imioMessage.fromId = proto.fromId;
        imioMessage.fromName = proto.fromName;
        imioMessage.destId = proto.destId;
        imioMessage.destName = proto.destName;
        imioMessage.cite = proto.cite;
        imioMessage.type = this.subtype(proto.subtype);
        imioMessage.title = proto.title;
        imioMessage.subtitle = proto.subtitle;
        imioMessage.text = proto.text;
        imioMessage.secret = proto.secret;
        imioMessage.thumb = proto.thumb;
        imioMessage.host = proto.host;
        imioMessage.url = proto.url;
        imioMessage.lng = proto.lng;
        imioMessage.lat = proto.lat;
        imioMessage.size = proto.size;
        imioMessage.length = proto.length;
        imioMessage.sent = proto.sent;
        imioMessage.deviceKey = proto.deviceKey;
        imioMessage.deviceTag = proto.deviceTag;
        imioMessage.sentDate = new Date(proto.sent);
        imioMessage.revoke = proto.revoke.length != 0;

        switch (proto.talkMode) {
            case 1:
                imioMessage.talk = IMIOMessageTalk.default;
                break;
            case 2:
                imioMessage.talk = IMIOMessageTalk.group;
                break;
            case 3:
                imioMessage.talk = IMIOMessageTalk.team;
                break;
        }

        switch (proto.label) {
            case 'tip':
                imioMessage.label = IMIOMessageLabel.tip;
                break;
            case 'notice':
                imioMessage.label = IMIOMessageLabel.notice;
                break;
            case 'action':
                imioMessage.label = IMIOMessageLabel.action;
                break;
            case 'cc':
                imioMessage.label = IMIOMessageLabel.notify;
                break;
            case 'bcc':
                imioMessage.label = IMIOMessageLabel.quietly;
                break;
        }

        if (proto.citeData) {
            imioMessage.citeData = this.buildMessage(proto.citeData)
        }
        if (proto.remind && proto.remind.length) {
            imioMessage.hintList = [];
            for (let item of proto.remind) {
                let imioMessage1 = new IMIOMessage();
                imioMessage1.fromId = item.fromId;
                imioMessage1.destId = item.destId;
                imioMessage1.destName = item.nickname
                imioMessage1.joinId = item.roomId
                imioMessage.hintList.push(imioMessage1);
            }
        }
        if (proto.cc && proto.cc.length) {
            imioMessage.notifyList = [];
            imioMessage.quietlyList = [];
            for (let item of proto.cc) {
                let imioMessage1 = new IMIOMessage();
                imioMessage1.fromId = item.fromId;
                imioMessage1.destId = item.destId;
                imioMessage1.destName = item.nickname
                imioMessage1.joinId = item.roomId
                if (item.sort == 0) {
                    imioMessage.notifyList.push(imioMessage1);
                } else {
                    imioMessage.quietlyList.push(imioMessage1);
                }
            }
        }
        return imioMessage;
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