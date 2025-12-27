
export class IOIMessageSender {

    msgId:string = '';
    joinId : number = 0;
    // targetId: string = '';
    // targetName: string = '';
    cite: string = '';
    readonly type: string = '';
    title: string = '';
    subtitle: string = '';
    text: string = '';
    secret: string = '';
    thumb: string = '';
    host: string = '';
    url: string = '';
    lng: string = '';
    lat: string = '';
    avatar: string = '';
    size:number = 0;
    length :number = 0;
    hintList:Array<IOIMessageSenderHint> | null = null;// 提及人列表
    notifyList:Array<IOIMessageSenderHint> | null = null // 抄送人
    quietlyList:Array<IOIMessageSenderHint> | null = null // 密送人

    constructor(type: string) {
        this.type = type
    }

    public static buildSimpleText(joinId: number,text: string): IOIMessageSender {
        let sender = new IOIMessageSender(IOIMessageType.TEXT);
        if (text.length > 80000) {
            throw Error("文本太长")
        }
        sender.joinId = joinId;
        sender.text = text;

        return sender;
    }

    public static buildImage(joinId: number,host: string,url: string,secret: string = ''): IOIMessageSender {
        let sender = new IOIMessageSender(IOIMessageType.IMG);
        if (host.length > 200) {
            throw Error("host 太长")
        }
        if (url.length > 2000) {
            throw Error("URL 太长")
        }
        if (secret.length > 500) {
            throw Error("secret 太长")
        }
        sender.joinId = joinId;
        sender.host = host;
        sender.url = url;
        sender.secret = secret;
        return sender;
    }
    public static buildFile(joinId: number,host: string,url: string,filename: string,secret: string = ''): IOIMessageSender {
        let sender = new IOIMessageSender(IOIMessageType.FILE);
        if (host.length > 200) {
            throw Error("host 太长")
        }
        if (url.length > 2000) {
            throw Error("URL 太长")
        }
        if (secret.length > 500) {
            throw Error("secret 太长")
        }
        sender.joinId = joinId;
        sender.host = host;
        sender.url = url;
        sender.text = filename;
        sender.secret = secret;
        return sender;
    }

    public static buildVideo(joinId: number,host: string,url: string,size:number,secret: string = ''): IOIMessageSender {
        let sender = new IOIMessageSender(IOIMessageType.VIDEO);
        if (host.length > 200) {
            throw Error("host 太长")
        }
        if (url.length > 2000) {
            throw Error("URL 太长")
        }
        if (secret.length > 500) {
            throw Error("secret 太长")
        }
        sender.joinId = joinId;
        sender.host = host;
        sender.url = url;
        sender.secret = secret;
        sender.size = size;
        return sender;
    }

    public static buildAudio(joinId: number,host: string,url: string,length:number,secret: string = ''): IOIMessageSender {
        let sender = new IOIMessageSender(IOIMessageType.AUDIO);
        if (host.length > 200) {
            throw Error("host 太长")
        }
        if (url.length > 2000) {
            throw Error("URL 太长")
        }
        if (secret.length > 500) {
            throw Error("secret 太长")
        }
        sender.joinId = joinId;
        sender.host = host;
        sender.url = url;
        sender.length = length;
        sender.secret = secret;
        return sender;
    }

    /**
     * 引用消息 的MessageID
     * @param messageId
     */
    public withCite(messageId: string): IOIMessageSender {
        if (messageId.length > 100) {
            throw Error("Cite 太长")
        }
        this.cite = messageId;
        return this
    }

    public withTitle(title: string): IOIMessageSender {
        if (title.length > 200) {
            throw Error("title 太长")
        }
        this.title = title;
        return this
    }

    public withMsgId(msgId: string): IOIMessageSender {
        if (msgId.length > 100) {
            throw Error("msgId 太长")
        }
        this.msgId = msgId;
        return this
    }

    public withAvatar(avatar: string): IOIMessageSender {
        if (avatar.length > 250) {
            throw Error("avatar 太长")
        }
        this.avatar = avatar;
        return this
    }

    public withSubtitle(subtitle: string): IOIMessageSender {
        if (subtitle.length > 200) {
            throw Error("subtitle 太长")
        }
        this.subtitle = subtitle;
        return this
    }

    /**
     * 文件 图片 密码参数，get传参 以 ? 开始
     * @param secret
     */
    public withSecret(secret: string): IOIMessageSender {
        if (this.type == IOIMessageType.TEXT) {
            throw new Error("Secret 属性与消息类型不匹配")
        }
        if (secret.length > 500) {
            throw new Error("Secret 长度太长")
        }
        this.secret = secret;
        return this
    }

    /**
     * 文件 图片 缩略图 完全地址
     * @param thumb
     */
    public withThumb(thumb: string): IOIMessageSender {
        if (this.type == IOIMessageType.TEXT) {
            throw new Error("Thumb 属性与消息类型不匹配")
        }
        if (thumb.length > 2000) {
            throw Error("thumb 太长")
        }
        this.thumb = thumb;
        return this
    }

    /**
     * 文件 图片 主机地址
     * @param host
     */
    public withHost(host: string): IOIMessageSender {
        if (this.type == IOIMessageType.TEXT) {
            throw new Error("Host 属性与消息类型不匹配")
        }
        if (host.length > 250) {
            throw new Error("Host 长度太长")
        }
        this.host = host;
        return this
    }

    /**
     * 文件 图片 路径地址
     * @param url
     */
    public withUrl(url: string): IOIMessageSender {
        if (this.type == IOIMessageType.TEXT) {
            throw new Error("Url 属性与消息类型不匹配")
        }
        if (url.length > 2000) {
            throw Error("URL 太长")
        }
        this.url = url;
        return this
    }

    /**
     * 文件 图片 大小 M
     * @param size
     */
    public withSize(size: number): IOIMessageSender {
        if (this.type != IOIMessageType.IMG
            && this.type != IOIMessageType.AUDIO
            && this.type != IOIMessageType.VIDEO
            && this.type != IOIMessageType.FILE) {
            throw new Error("Size 属性与消息类型不匹配")
        }
        this.size = size;
        return this
    }

    /**
     * 语音时长
     * @param length
     */
    public withLength(length: number): IOIMessageSender {
        if (this.type != IOIMessageType.AUDIO) {
            throw new Error("Length 属性与消息类型不匹配")
        }
        this.length = length;
        return this
    }

}

export class IOIMessageSenderHint {
    targetId: string = '';
    targetName: string = '';
    avatar: string = '';
}

export enum IOIMessageType {
    TEXT = 'txt',
    IMG = 'img',
    AUDIO = 'audio',
    VIDEO = 'video',
    FILE = 'file',
    LOC = 'loc',
    WALLET = 'wallet',
    CUSTOM = 'custom',

}