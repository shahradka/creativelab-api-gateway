import { IProxyServiceHttp } from "@/core/ports/proxy.service.port";

export class ProxyRequestHttpUseCase{
    constructor(private proxyService:IProxyServiceHttp){}

    async execute(
        request: Request,
        targetBaseUrl: string,
        extraHeaders: Record<string, string> = {}
    ):Promise<Response>{
        return this.proxyService.forward(request, targetBaseUrl, extraHeaders)
    }
}