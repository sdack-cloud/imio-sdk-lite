import {IOIClient} from "./src/Client";

import {IOIClientOption} from './src/Option'
import {IOIRoomManager} from "./src/manager/TeamManager";
import {IOIClientConnectStatus, IOIClientListener} from "./src/listener/ClientListener";
import {IOIContactManager} from "./src/manager/ContactManager";
import {IOIGroupManager} from "./src/manager/GroupManager";
import {onlyour as RoomPB} from "./src/protocol/Rooms";
// export {IOIClientOption,IOIClient}

let clientOption = IOIClientOption.newBuilder()
    .whitAppId("25").whitHost("192.168.31.35:8000").whitDebug(true);
let imioClient = IOIClient.getInstance().whitOption(clientOption);

const token1 = '';
const token = '';
const nickname = '';
const userId = 776892;


let contactManager = IOIContactManager.getInstance().setIOIClient(imioClient);
let groupManager = IOIGroupManager.getInstance().setIOIClient(imioClient);



const clientListener : IOIClientListener = {
    onConnectStatus(status: IOIClientConnectStatus, retry: number): void {
        console.log('clientListener onConnectStatus:', status.toString(),retry)
    }, onConnected(): void {
        console.log('clientListener onConnected')
    }, onDisconnected(): void {
        console.log('clientListener onDisconnected')

    }, onTokenExpired(): void {
        console.log('clientListener onTokenExpired')
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const applyInput = document.querySelector('input[name="apply"]') as HTMLInputElement;
    const userIdInput = document.querySelector('input[name="userId"]') as HTMLInputElement;
    const joinRoomIdInput = document.querySelector('input[name="joinRoomId"]') as HTMLInputElement;
    const remarkInput = document.querySelector('input[name="remark"]') as HTMLInputElement;
    const messageIdInput = document.querySelector('input[name="messageId"]') as HTMLInputElement;
    const memberIds = document.querySelector('input[name="memberIds"]') as HTMLInputElement;

    const btn = document.getElementById('connect') as HTMLButtonElement;
    const btnClose = document.getElementById('close') as HTMLButtonElement;
    const apply = document.getElementById('apply') as HTMLButtonElement;
    const applyHandle = document.getElementById('applyHandle') as HTMLButtonElement;
    const crate = document.getElementById('create') as HTMLButtonElement;

    btn.addEventListener('click', () => {
        console.log(`Connect ==`);
        imioClient.connect(Number(userIdInput.value),token,nickname,clientListener)
    })
    btnClose.addEventListener('click', () => {
        console.log(`Close ==`);
        imioClient.disconnect()

    })
    apply.addEventListener('click', () => {
        console.log(`apply ==`);
        contactManager.addContact(Number(joinRoomIdInput.value),remarkInput.value).then(res => {
            console.log('apply ==',res)

        }).catch(err => {
            console.warn('apply==',err.message)
        })
    })

    applyHandle.addEventListener('click', () => {
        console.log(`applyHandle ==`,applyInput.value);
        contactManager.handleApply(messageIdInput.value,applyInput.value == '1',remarkInput.value)
            .then(res => {
                console.log('applyHandle ==',res)

            }).catch(err => {
            console.warn('applyHandle ==',err.message)
        })
    })

    crate.addEventListener('click', () => {
        console.log(`createGroup ==`,memberIds.value);
        let value = remarkInput.value;
        let ids = memberIds.value.split(",");
        groupManager.createGroup(value,ids).then(res => {
            console.log('createGroup ==',res)
        }).catch(err => {
            console.warn('createGroup ==',err.message)
        })
    })
})


