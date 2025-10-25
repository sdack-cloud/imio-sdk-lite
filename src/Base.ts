import {RSocket, RSocketConnector} from "rsocket-core";
import {WebsocketClientTransport} from "rsocket-websocket-client";

import {
    decodeCompositeMetadata,
    encodeBearerAuthMetadata,
    encodeCompositeMetadata,
    encodeRoute, ExplicitMimeTimeEntry,
    WellKnownMimeType
} from "rsocket-composite-metadata";

import {IMIOAccountUser} from "./entity/AccountUser";
import {IMIOContact} from "./entity/Contact";
import {IMIOMember} from "./entity/Member";
import {IMIOGroup,IMIOGroupType} from "./entity/Group";
// =======
import {onlyour as MetaPB} from "./protocol/Meta";
import {onlyour as ContactPB} from "./protocol/Contacts";
import {onlyour as RoomPB} from "./protocol/Rooms";


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
}