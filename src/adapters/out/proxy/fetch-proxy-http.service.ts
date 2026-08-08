import { IProxyServiceHttp } from "@/core/ports/proxy.service.port";

export class FetchProxyHttpService implements IProxyServiceHttp {
    async forward(request: Request, targetUrl: string, headersToAdd?: Record<string, string>): Promise<Response> {
        const url = new URL(request.url)
        const destination = `${targetUrl}${url.pathname}${url.search}`

        const headers = new Headers(request.headers)
        if(headersToAdd){
            Object.entries(headersToAdd).forEach(([key, value]) => {
                headers.set(key, value)
            });
        }
        
        try{
            return await fetch(destination, {
                method:request.method,
                headers: request.headers,
                body: ['GET', 'HEAD'].includes(request.method)? null : await request.body,
            })
        } catch(error) {
            return new Response(JSON.stringify({ error: 'Upstream service unreachable' }), { status: 502 })
        }
    }

}