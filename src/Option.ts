

export class IMIOClientOption {

    private _appId: string = '';
    private _issuer: string = '';
    private _host: string = '';
    private _hosts: Array<string> = [];
    private _debug: boolean = false;

    private constructor() {
    }


    public static newBuilder() : IMIOClientOption {
        return new IMIOClientOption()
    }

    public whitAppId(appId: string) : IMIOClientOption {
        this._appId = appId
        return this
    }
    public whitIssuer(issuer: string) : IMIOClientOption {
        this._issuer = issuer
        return this
    }
    public whitHost(host: string) : IMIOClientOption {
        this._host = host
        this._hosts.push(host);
        return this
    }

    public whitHosts(hosts: Array<string>) : IMIOClientOption {
        this._hosts = hosts
        return this
    }

    public whitDebug(debug: boolean) : IMIOClientOption {
        this._debug = debug
        return this
    }

    public build() {
        return this
    }


    get appId(): string {
        return this._appId;
    }

    get issuer(): string {
        return this._issuer;
    }

    get host(): string {
        return this._host;
    }


    set host(value: string) {
        this._host = value;
    }

    get hosts(): Array<string> {
        return this._hosts;
    }

    get debug(): boolean {
        return this._debug;
    }

}


