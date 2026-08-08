import { IProxyServiceWorker } from "@/core/ports/proxy.service.port";
import { Fetcher, Request as CFRequest, Response as CFResponse } from "@cloudflare/workers-types";

export class FetchProxyWorkerService implements IProxyServiceWorker {
    async forward(request: Request, fetcher: Fetcher, headersToAdd?: Record<string, string>): Promise<Response> {
        let reqToForward = request

        if (headersToAdd) {
            const headers = new Headers(request.headers)
            Object.entries(headersToAdd).forEach(([key, value]) => {
                headers.set(key, value)
            })
            reqToForward = new Request(request, { headers })
        }

        try{
            return await fetcher.fetch(reqToForward as unknown as CFRequest)
        } catch(error) {
            return new Response(JSON.stringify({ error: 'Upstream service unreachable' }), { status: 502 })
        }
    }

}