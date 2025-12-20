import {
    encodeBearerAuthMetadata,
    encodeCompositeMetadata,
    encodeRoute,
    WellKnownMimeType
} from "rsocket-composite-metadata";
import {IOIBase} from "../Base";


export class IOIBaseManager  extends IOIBase{



    /**
     * socket建立后 请求不用携带token，
     * 但是token过期后请求会错误，请求携带着token，及时建立连接时过期了也可以访问(token及时被交换的情况下)
     */
    public buildRoute(routeName: string, token: string = ''): Buffer {
        let route = encodeRoute(routeName);
        if (token.length > 100) {
            return encodeCompositeMetadata([
                [WellKnownMimeType.MESSAGE_RSOCKET_ROUTING, route],
                [WellKnownMimeType.MESSAGE_RSOCKET_AUTHENTICATION, encodeBearerAuthMetadata(token)]
            ]);
        } else {
            return encodeCompositeMetadata([
                [WellKnownMimeType.MESSAGE_RSOCKET_ROUTING, route],
                /*[WellKnownMimeType.MESSAGE_RSOCKET_AUTHENTICATION, encodeBearerAuthMetadata(this.token)]*/
            ]);
        }
    }
}