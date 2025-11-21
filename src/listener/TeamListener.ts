import {IMIOMessage} from "../entity/Message";


export interface IMIOTeamListener {

    onMessage(message: IMIOMessage): void

}