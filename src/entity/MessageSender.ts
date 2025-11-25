
export class IMIOMessageSender {

    messageId:string = '';
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
    size:number = 0;
    length :number = 0;
    hintList:Array<IMIOMessageSenderHint> | null = null;// 提及人列表
    notifyList:Array<IMIOMessageSenderHint> | null = null // 抄送人
    quietlyList:Array<IMIOMessageSenderHint> | null = null // 密送人

    constructor(type: string) {
        this.type = type
    }

    public static buildSimpleText(joinId: number,text: string): IMIOMessageSender {
        let sender = new IMIOMessageSender(IMIOMessageType.TEXT);
        if (text.length > 80000) {
            throw Error("文本太长")
        }
        sender.joinId = joinId;
        sender.text = text;

        return sender;
    }

    public static buildImage(joinId: number,host: string,url: string,secret: string = ''): IMIOMessageSender {
        let sender = new IMIOMessageSender(IMIOMessageType.IMG);
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
    public static buildFile(joinId: number,host: string,url: string,filename: string,secret: string = ''): IMIOMessageSender {
        let sender = new IMIOMessageSender(IMIOMessageType.FILE);
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

    public static buildVideo(joinId: number,host: string,url: string,size:number,secret: string = ''): IMIOMessageSender {
        let sender = new IMIOMessageSender(IMIOMessageType.VIDEO);
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

    public static buildAudio(joinId: number,host: string,url: string,length:number,secret: string = ''): IMIOMessageSender {
        let sender = new IMIOMessageSender(IMIOMessageType.AUDIO);
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
    public withCite(messageId: string): IMIOMessageSender {
        if (messageId.length > 100) {
            throw Error("Cite 太长")
        }
        this.cite = messageId;
        return this
    }

    public withTitle(title: string): IMIOMessageSender {
        if (title.length > 200) {
            throw Error("title 太长")
        }
        this.title = title;
        return this
    }

    public withSubtitle(subtitle: string): IMIOMessageSender {
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
    public withSecret(secret: string): IMIOMessageSender {
        if (this.type == IMIOMessageType.TEXT) {
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
    public withThumb(thumb: string): IMIOMessageSender {
        if (this.type == IMIOMessageType.TEXT) {
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
    public withHost(host: string): IMIOMessageSender {
        if (this.type == IMIOMessageType.TEXT) {
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
    public withUrl(url: string): IMIOMessageSender {
        if (this.type == IMIOMessageType.TEXT) {
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
    public withSize(size: number): IMIOMessageSender {
        if (this.type != IMIOMessageType.IMG
            && this.type != IMIOMessageType.AUDIO
            && this.type != IMIOMessageType.VIDEO
            && this.type != IMIOMessageType.FILE) {
            throw new Error("Size 属性与消息类型不匹配")
        }
        this.size = size;
        return this
    }

    /**
     * 语音时长
     * @param length
     */
    public withLength(length: number): IMIOMessageSender {
        if (this.type != IMIOMessageType.AUDIO) {
            throw new Error("Length 属性与消息类型不匹配")
        }
        this.length = length;
        return this
    }

}

export class IMIOMessageSenderHint {
    targetId: string = '';
    targetName: string = '';
    avatar: string = '';
}

export enum IMIOMessageType {
    TEXT = 'txt',
    IMG = 'img',
    AUDIO = 'audio',
    VIDEO = 'video',
    FILE = 'file',
    LOC = 'loc',
    WALLET = 'wallet',
    CUSTOM = 'custom',

}