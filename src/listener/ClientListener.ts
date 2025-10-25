

    export interface IMIOClientListener {
        /**
         *  客户端已连接
         */
        onConnected(): void

        /**
         * 连接中的状态
         * @param status IMIOClientStatus
         * @param retry 发起或重试次数,0 为链接发起
         */
        onConnectStatus(status:IMIOClientConnectStatus ,retry :number): void

        /**
         * token 过期事件
         */
        onTokenExpired(): void

        // 服务端强制下线，设备剔除登录,连接被终止 ，可根据需求重新发起请求
        onDisconnected(): void
    }

    export enum IMIOClientConnectStatus {
        DONE = 0, // 初始状态
        ERROR = -1, // 服务器错误 //
        CONNECTING = 1, // 连接中
        SUCCESS_PULL = 2, // 连接成功，数据拉取中
        SUCCESS = 3, //  成功在线
        RETRY_CONNECTING = 4, // 建立连接重试中
        TOKEN_EXPIRED = 5, // token过期引发的失败，不会触发重连,需要手动发起
    }

    export enum IMIOClientStatus {
        ERROR = 0, // 连接错误
        CONNECT = 1, // 连接中
        PULL = 2, // 数据拉取中
        SUCCESS = 3, //  成功在线
        OFFLINE = 4, // 服务端强制下线
    }

    export enum IMIOSystemMessage {
        APPLY = 1, // 申请
        APPLY_RESOLVE = 2, // 申请被处理
        APPLY_AGREE = 3, // 申请已同意
        APPLY_REJECT = 4, //  申请已拒绝
        ROOM_EXIT=5, // 群成员退出
        ROOM_DISSOLVE=6,// 群解散
    }
