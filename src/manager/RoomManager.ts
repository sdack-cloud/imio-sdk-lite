import {IMIOClient} from "../Client";


export class IMIORoomManager {


    // ========= 单例模式 =========
    private static instance: IMIORoomManager;

    public imioClient: IMIOClient | null = null;

    private constructor() {
    }

    public static getInstance(): IMIORoomManager {
        if (!IMIORoomManager.instance) {
            IMIORoomManager.instance = new IMIORoomManager();
        }
        return IMIORoomManager.instance;
    }

    public setIMIOClient(client : IMIOClient) : IMIORoomManager{
        this.imioClient = client
        return this
    }
    // ========= 单例模式 END =========

}