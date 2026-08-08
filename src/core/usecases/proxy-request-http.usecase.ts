import { IProxyServiceHttp } from "@/core/ports/proxy.service.port";

export class ProxyRequestHttpUseCase{
    constructor(private proxyService:IProxyServiceHttp){}

    async execute(request: Request, targetBaseUrl: string):Promise<Response>{

        const extraHeaders:Record<string, string> = {}

        return this.proxyService.forward(request, targetBaseUrl, extraHeaders)
    }
}