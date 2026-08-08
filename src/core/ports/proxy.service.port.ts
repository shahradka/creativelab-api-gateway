import { Fetcher } from "@cloudflare/workers-types"

export interface IProxyServiceHttp {
  forward(request: Request, targetUrl: string, headersToAdd?: Record<string, string>): Promise<Response>
}

export interface IProxyServiceWorker {
    forward(request: Request, fetcher:Fetcher, headersToAdd?: Record<string, string>): Promise<Response>
}