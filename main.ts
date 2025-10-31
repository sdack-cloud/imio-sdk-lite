import {IMIOClient} from "./src/Client";

import {IMIOClientOption} from './src/Option'
import {IMIORoomManager} from "./src/manager/RoomManager";
import {IMIOClientConnectStatus} from "./src/listener/ClientListener";
import {IMIOContactManager} from "./src/manager/ContactManager";
import {IMIOGroupManager} from "./src/manager/GroupManager";
import {IMIOUserInfoManager} from "./src/manager/UserInfoManager";
import {IMIOChatManager} from "./src/manager/ChatManager";
import {IMIOMessageSender,IMIOMessageType,IMIOMessageSenderHint} from './src/entity/MessageSender'
import {IMIOMessageLabel,IMIOMessage,IMIOMessageTalk,IMIOMessageRemind} from "./src/entity/Message";
import {IMIOContact} from "./src/entity/Contact";
import {IMIOGroup, IMIOGroupType} from "./src/entity/Group";
import {IMIOMember} from "./src/entity/Member";




export default {
    IMIOClient,
    IMIOClientOption,
    IMIOGroupManager,
    IMIOContactManager,
    IMIOClientConnectStatus,
    IMIORoomManager,
    IMIOMessageSender,
    IMIOMessageSenderHint,
    IMIOMessageType,
    IMIOUserInfoManager,
    IMIOMessageLabel,
    IMIOMessage,
    IMIOMessageTalk,
    IMIOMessageRemind,
    IMIOContact,
    IMIOGroup,
    IMIOGroupType,
    IMIOChatManager,
    IMIOMember
}