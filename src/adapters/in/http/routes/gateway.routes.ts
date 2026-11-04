import { Hono } from 'hono'
import type { Context, MiddlewareHandler } from 'hono'
import type { Fetcher } from '@cloudflare/workers-types'
import { RouteConfig, type HttpMethod, type RouteRule } from '@/core/domain/route-config'
import { ProxyRequestHttpUseCase } from '@/core/usecases/proxy-request-http.usecase'
import { ProxyRequestWorkerUseCase } from '@/core/usecases/proxy-request-worker.usecase'
import { FetchProxyHttpService } from '@/adapters/out/proxy/fetch-proxy-http.service'
import { FetchProxyWorkerService } from '@/adapters/out/proxy/fetch-proxy-worker.service'
import { createJwtServiceTokenSigner } from '@/adapters/out/auth/jwt-service-token.service'
import { SERVICE_TOKEN_HEADER } from '@/core/security/service-token'
import { createRateLimiter } from '@/middlewares/ratelimiter'
import { authMiddleware } from '@/middlewares/auth'
import type { AppEnv } from '@/config/env'

const proxyHttpUseCase = new ProxyRequestHttpUseCase(new FetchProxyHttpService())
const proxyWorkerUseCase = new ProxyRequestWorkerUseCase(new FetchProxyWorkerService())

/**
 * Builds a Hono sub-app from the declarative route rules.
 *
 * Each rule controls the path, allowed methods, auth, rate limiting and the
 * upstream target (HTTP base URL or Cloudflare service binding).
 */
export function createGatewayRoutes(rules: RouteRule[]): Hono<AppEnv> {
    const app = new Hono<AppEnv>()
    const routeConfig = new RouteConfig(rules)

    for (const rule of rules) {
        const middlewares: MiddlewareHandler<AppEnv>[] = []

        if (rule.isProtected) {
            middlewares.push(authMiddleware)
        }

        if (rule.rateLimitName) {
            middlewares.push(createRateLimiter(rule.rateLimitName, rule.id))
        }

        if (middlewares.length > 0) {
            app.use(rule.pathPattern, ...middlewares)
        }

        const handler = async (c: Context<AppEnv>) => {
            const matched = routeConfig.findMatchingRule(
                c.req.path,
                c.req.method as HttpMethod
            )

            if (!matched) {
                return c.json({ error: 'Route not found' }, 404)
            }

            // Fail closed: never forward a request to an upstream service
            // without a verifiable service token.
            const serviceTokenSigner = createJwtServiceTokenSigner(c.env)

            if (!serviceTokenSigner) {
                return c.json(
                    { error: 'Server misconfigured: SERVICE_JWT_SECRET is not set' },
                    500
                )
            }

            const serviceToken = await serviceTokenSigner.sign({
                routeId: matched.id,
                method: c.req.method,
                path: c.req.path,
            })

            // `headers.set` in the proxy adapters overwrites any client-supplied
            // value, so an attacker cannot spoof this header.
            const extraHeaders: Record<string, string> = {
                [SERVICE_TOKEN_HEADER]: serviceToken,
            }

            if (matched.targetBinding) {
                const fetcher = c.env[matched.targetBinding] as Fetcher | undefined

                if (!fetcher) {
                    return c.json(
                        { error: `Upstream binding '${matched.targetBinding}' is not configured` },
                        500
                    )
                }

                return proxyWorkerUseCase.execute(c.req.raw, fetcher, extraHeaders)
            }

            if (matched.targetBaseUrl) {
                return proxyHttpUseCase.execute(c.req.raw, matched.targetBaseUrl, extraHeaders)
            }

            return c.json(
                { error: `No upstream target configured for route '${matched.id}'` },
                500
            )
        }

        for (const method of rule.allowedMethods) {
            if (method === 'ALL') {
                app.all(rule.pathPattern, handler)
            } else {
                app.on(method, rule.pathPattern, handler)
            }
        }
    }

    return app
}
