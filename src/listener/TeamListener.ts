import {IOIMessage} from "../entity/Message";


export interface IOITeamListener {
    id : string;

    onMessage(message: IOIMessage): void

}