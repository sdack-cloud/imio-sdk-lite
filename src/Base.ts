import {RSocket} from "rsocket-core";

import {
    decodeCompositeMetadata,
    encodeCompositeMetadata,
    encodeRoute,
    ExplicitMimeTimeEntry,
    WellKnownMimeType
} from "rsocket-composite-metadata";

import {IMIOAccountUser} from "./entity/AccountUser";
import {IMIOContact} from "./entity/Contact";
import {IMIOMember} from "./entity/Member";
import {IMIOGroup, IMIOGroupType} from "./entity/Group";
// =======
import {onlyour as MetaPB} from "./protocol/Meta";
import {onlyour as ContactPB} from "./protocol/Contacts";
import {onlyour as RoomPB} from "./protocol/Rooms";
import {onlyour as MessagePB} from "./protocol/Message";
import {IMIOMessage, IMIOMessageLabel, IMIOMessageTalk} from "./entity/Message";


export class IMIOBase {

    protected static _version = 1.0

    public token = ""; // token
    public pageSize = 300;
    protected account : IMIOAccountUser | null = null; // 这里为 null 是为了，切换用户后重新赋值

    protected deviceId = ""; // 浏览器指纹码
    protected deviceName = ""; //浏览器设备
    protected deviceModel = ""; //浏览器设备

    public readonly meta: MetaPB.imio.Meta =  new MetaPB.imio.Meta({
        v: IMIOBase._version,
        deviceTag: 'h5',
        page: 0, pageSize: 30
    });

    // private axios ?: AxiosInstance

    public socket?: RSocket | null;

    public readonly contactList:Array<IMIOContact> = [];

    private getJwtPayload(token: string): Object {
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

    protected buildContact(proto: ContactPB.imio.Contacts): IMIOContact {
        let data = new IMIOContact();
        data.contactId = proto.id
        data.joinId = proto.joinRoomId;
        data.userId = proto.userId;
        data.nickname = proto.nickname;
        data.username = proto.username;
        data.avatar = proto.avatar;
        data.status = proto.status;
        data.isGroup = proto.talkMode == 2;
        data.joinTime = proto.joinTime;
        data.isMuted = proto.muted == 1;
        data.noise = proto.noise;
        return data;
    }

    protected buildMember(proto: ContactPB.imio.Contacts): IMIOMember {
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

    protected buildGroup(proto: RoomPB.imio.Rooms): IMIOGroup {
        let data = new IMIOGroup();
        data.groupId = proto.id;
        data.groupName = proto.roomname
        data.groupNumber = proto.account;
        data.userId = proto.userId;
        data.avatar = proto.avatar;
        data.depict = proto.depict;
        data.isTalk = proto.talkMode == 1;
        data.isApproval = proto.applyJoin == 1;
        data.isInvite = proto.applyNeed == 1;
        data.maxMember = proto.roomMax;
        data.isGroup = proto.talkMode == 2;
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

    protected buildMessage(proto: MessagePB.imio.Message) : IMIOMessage {
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