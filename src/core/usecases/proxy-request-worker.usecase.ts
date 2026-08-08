import { IProxyServiceWorker } from "@/core/ports/proxy.service.port";
import { Fetcher } from "@cloudflare/workers-types";

export class ProxyRequestWorkerUseCase{
    constructor(private proxyService:IProxyServiceWorker){}

    async execute(request: Request, targetBaseUrl: Fetcher):Promise<Response>{

        const extraHeaders:Record<string, string> = {}

        return this.proxyService.forward(request, targetBaseUrl, extraHeaders)
    }
}