import {IOIClient} from "./src/Client";

import {IOIClientOption} from './src/Option'
import {IOITeamManager} from "./src/manager/TeamManager";
import {IOIClientConnectStatus} from "./src/listener/ClientListener";
import {IOIContactManager} from "./src/manager/ContactManager";
import {IOIGroupManager} from "./src/manager/GroupManager";
import {IOIUserInfoManager} from "./src/manager/UserInfoManager";
import {IOIChatManager} from "./src/manager/ChatManager";
import {IOIMessageSender,IOIMessageType,IOIMessageSenderHint} from './src/entity/MessageSender'
import {IOIMessageLabel,IOIMessage,IOIMessageTalk} from "./src/entity/Message";
import {IOIContact, IOIContactNotice, IOIContactStatus} from "./src/entity/Contact";
import {IOIGroup, IOIGroupType} from "./src/entity/Group";
import {IOIMember} from "./src/entity/Member";
import {IOIDeviceStatus} from "./src/entity/Status";



export default {
    IOIClient,
    IOIClientOption,
    IOIGroupManager,
    IOIContactManager,
    IOIClientConnectStatus,
    IOITeamManager,
    IOIMessageSender,
    IOIMessageSenderHint,
    IOIMessageType,
    IOIUserInfoManager,
    IOIMessageLabel,
    IOIMessage,
    IOIMessageTalk,
    IOIContact,
    IOIContactStatus,
    IOIGroup,
    IOIGroupType,
    IOIChatManager,
    IOIMember,
    IOIDeviceStatus,
    IOIContactNotice
}