import { IProxyServiceWorker } from '@/core/ports/proxy.service.port'
import type { Fetcher, Request as CFRequest } from '@cloudflare/workers-types'

export class FetchProxyWorkerService implements IProxyServiceWorker {
    async forward(
        request: Request,
        fetcher: Fetcher,
        headersToAdd?: Record<string, string>
    ): Promise<Response> {
        let requestToForward = request

        if (headersToAdd && Object.keys(headersToAdd).length > 0) {
            const headers = new Headers(request.headers)
            for (const [key, value] of Object.entries(headersToAdd)) {
                headers.set(key, value)
            }
            requestToForward = new Request(request, { headers })
        }

        try {
            const response = await fetcher.fetch(requestToForward as unknown as CFRequest)
            return response as unknown as Response
        } catch {
            return new Response(JSON.stringify({ error: 'Upstream service unreachable' }), {
                status: 502,
                headers: { 'content-type': 'application/json' },
            })
        }
    }
}
