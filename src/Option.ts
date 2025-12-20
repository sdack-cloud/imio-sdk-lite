

export class IOIClientOption {

    private _appId: string = '';
    private _issuer: string = '';
    private _host: string = '';
    private _hosts: Array<string> = [];
    private _debug: boolean = false;
    private _wss: boolean = false;

    private constructor() {
    }


    public static newBuilder() : IOIClientOption {
        return new IOIClientOption()
    }

    public whitAppId(appId: string) : IOIClientOption {
        this._appId = appId
        return this
    }
    public whitIssuer(issuer: string) : IOIClientOption {
        this._issuer = issuer
        return this
    }
    public whitHost(host: string) : IOIClientOption {
        this._host = host
        this._hosts.push(host);
        return this
    }

    public whitHosts(hosts: Array<string>) : IOIClientOption {
        this._hosts = hosts
        return this
    }

    public whitDebug(debug: boolean) : IOIClientOption {
        this._debug = debug
        return this
    }

    public whitWss(col: boolean) : IOIClientOption {
        this._wss = col
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
    get isWss(): boolean {
        return this._wss;
    }

}


