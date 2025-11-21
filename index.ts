import {IMIOClient} from "./src/Client";

import {IMIOClientOption} from './src/Option'
import {IMIORoomManager} from "./src/manager/TeamManager";
import {IMIOClientConnectStatus, IMIOClientListener} from "./src/listener/ClientListener";
import {IMIOContactManager} from "./src/manager/ContactManager";
import {IMIOGroupManager} from "./src/manager/GroupManager";
import {onlyour as RoomPB} from "./src/protocol/Rooms";
// export {IMIOClientOption,IMIOClient}

let clientOption = IMIOClientOption.newBuilder()
    .whitAppId("25").whitHost("192.168.31.35:8000").whitDebug(true);
let imioClient = IMIOClient.getInstance().whitOption(clientOption);

const token1 = 'eyJraWQiOiI1NzFlZjE2Yy1mMTFjLTQzNzItODAxOS0zZDkyOGE2MmY1YjgiLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIzMjEiLCJhdWQiOiIzMjEiLCJuYmYiOjE3NjEwMTIwMDAsImlzcyI6Imh0dHA6Ly8zOS4xMDAuNzIuMTgxOjkwMDAiLCJleHAiOjE3NjEwODQwMDAsImlhdCI6MTc2MTAxMjAwMCwianRpIjoiMmQxZTlkZTEtMWYyNi00OTQ5LWFjMmItZDE3MzIxODE3ZmE3In0.w2lo7TLPZuUbzkSBBTfpe4gRyzd-W6z0imtIfOMim7_z4Um8IN2OPbsO5qe_6eas6eDC6LxudUMkRCHxPhmnOPvlFw16py7Mu-5z-OqhlMeZseLMgyRqRIMaXCx9RY4D-DWKJOt50SH_wg834F_0xq2d183ZXwEjYTTM40qHUrtStVbfBafm0cPo_1bFtpJzChIBRY9u5V9rhuK0KfV6ufJao4mZ35DID7V1DS4pT_NgnI2dpBf6g1ihr0QCuvvGG76W8xpfeyYNCyl81JWy1VP04H17fMm0LVUyl-xIyBWjRW-DnhqJ_Ksug0JMHOTFDzmHY1eYwbKa_1Lhh0jnbQ';
const token = 'eyJraWQiOiI1NzFlZjE2Yy1mMTFjLTQzNzItODAxOS0zZDkyOGE2MmY1YjgiLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIzMjEiLCJhdWQiOiIzMjEiLCJuYmYiOjE3NjEzNjkyNzMsImlzcyI6Imh0dHA6Ly8zOS4xMDAuNzIuMTgxOjkwMDAiLCJleHAiOjE3NjE0NDEyNzMsImlhdCI6MTc2MTM2OTI3MywianRpIjoiMjY4Yzc5MGEtMDg0MS00MGM5LTkwMWQtMzI5Y2NlNWE4NTlhIn0.DBSez_gL9Ugrpvqmj25oy01em50CcrRhZB4_qJ4Rz5ZU_hQugs0D-nnjYTVvIgBIXx4iJx76VDXv39dxdFTE2FiGHmeCPlvdbA1XHQIJDjANIforAwlEYu_hHz3KTYFisSJY4qMKmy0Jym-bxU7e3a5i2tTEGq1H-BCku6JKNXrqpJr1vb2dirci-LPuqnS6lWbgW283E9plrqladwyADq1nMJPDNXcV_acLZpYQNDoke0UW2vqObfv5Qk8_GKyXOfTGjh-7PHFlkgDBsNWPmfg2OMJs6iAgE-IB3iHPzIW_9TqCNhUxlGrE-6LWZawEIVNBCfGs0rrxEtQ2BwvriA';
const nickname = '';
const userId = 776892;


let contactManager = IMIOContactManager.getInstance().setIMIOClient(imioClient);
let groupManager = IMIOGroupManager.getInstance().setIMIOClient(imioClient);



const clientListener : IMIOClientListener = {
    onConnectStatus(status: IMIOClientConnectStatus, retry: number): void {
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


