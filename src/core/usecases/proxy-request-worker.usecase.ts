import { IProxyServiceWorker } from '@/core/ports/proxy.service.port'
import type { Fetcher } from '@cloudflare/workers-types'

export class ProxyRequestWorkerUseCase {
    constructor(private proxyService: IProxyServiceWorker) {}

    async execute(
        request: Request,
        fetcher: Fetcher,
        extraHeaders: Record<string, string> = {}
    ): Promise<Response> {
        return this.proxyService.forward(request, fetcher, extraHeaders)
    }
}
