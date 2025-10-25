import {IMIOClient} from "../Client";


export class IMIOChatManager {
    // ========= 单例模式 =========
    private static instance: IMIOChatManager;

    public imioClient: IMIOClient | null = null;

    private constructor() {
    }

    public static getInstance(): IMIOChatManager {
        if (!IMIOChatManager.instance) {
            IMIOChatManager.instance = new IMIOChatManager();
        }
        return IMIOChatManager.instance;
    }

    public setIMIOClient(client : IMIOClient) : IMIOChatManager{
        this.imioClient = client
        return this
    }
    // ========= 单例模式 END =========
}