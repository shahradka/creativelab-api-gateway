/** Context attached to a service token so upstreams can audit the call. */
export interface ServiceTokenContext {
    routeId?: string
    method?: string
    path?: string
}

/** Signs a short-lived token that proves a request originated from the gateway. */
export interface IServiceTokenSigner {
    sign(context?: ServiceTokenContext): Promise<string>
}
