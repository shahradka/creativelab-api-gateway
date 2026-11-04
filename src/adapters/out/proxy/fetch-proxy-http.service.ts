import { IProxyServiceHttp } from '@/core/ports/proxy.service.port'

export class FetchProxyHttpService implements IProxyServiceHttp {
    async forward(
        request: Request,
        targetBaseUrl: string,
        headersToAdd?: Record<string, string>
    ): Promise<Response> {
        const incomingUrl = new URL(request.url)
        const baseUrl = new URL(targetBaseUrl)
        const basePath = baseUrl.pathname.replace(/\/$/, '')
        const destination = new URL(
            `${basePath}${incomingUrl.pathname}${incomingUrl.search}`,
            baseUrl.origin
        )

        const headers = new Headers(request.headers)
        if (headersToAdd) {
            for (const [key, value] of Object.entries(headersToAdd)) {
                headers.set(key, value)
            }
        }

        const hasBody = !['GET', 'HEAD'].includes(request.method)

        try {
            return await fetch(destination.toString(), {
                method: request.method,
                headers,
                body: hasBody ? (request.body as BodyInit | null) : null,
                redirect: 'manual',
            })
        } catch {
            return new Response(JSON.stringify({ error: 'Upstream service unreachable' }), {
                status: 502,
                headers: { 'content-type': 'application/json' },
            })
        }
    }
}
