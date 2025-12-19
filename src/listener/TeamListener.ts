import {IMIOMessage} from "../entity/Message";


export interface IMIOTeamListener {
    id : string;

    onMessage(message: IMIOMessage): void

}