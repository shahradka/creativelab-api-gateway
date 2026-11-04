import { createMiddleware } from 'hono/factory'
import {
    SERVICE_TOKEN_HEADER,
    verifyServiceToken,
    type ServiceTokenClaims,
} from '@/core/security/service-token'

export interface ServiceTokenMiddlewareOptions {
    /** Shared private secret. Must be the same value configured on the gateway. */
    secret: string
    issuer?: string
    audience?: string
    /** Header that carries the token. Defaults to `x-service-token`. */
    headerName?: string
}

type ServiceTokenEnv = {
    Variables: {
        serviceTokenClaims: ServiceTokenClaims
    }
}

/**
 * Hono middleware for upstream services.
 *
 * Rejects any request that does not carry a valid gateway-issued service token,
 * which blocks direct calls from other domains even if they know the URL.
 *
 * Usage inside an upstream Worker:
 *
 * ```ts
 * app.use(
 *   '*',
 *   createServiceTokenMiddleware({
 *     secret: c.env.SERVICE_JWT_SECRET,
 *     issuer: c.env.SERVICE_JWT_ISSUER,
 *     audience: c.env.SERVICE_JWT_AUDIENCE,
 *   })
 * )
 * ```
 */
export function createServiceTokenMiddleware(options: ServiceTokenMiddlewareOptions) {
    const headerName = options.headerName ?? SERVICE_TOKEN_HEADER

    return createMiddleware<ServiceTokenEnv>(async (c, next) => {
        const token = c.req.header(headerName)

        if (!token) {
            return c.json({ error: 'Missing service token' }, 401)
        }

        try {
            const claims = await verifyServiceToken(token, options)
            c.set('serviceTokenClaims', claims)
        } catch {
            return c.json({ error: 'Invalid or expired service token' }, 401)
        }

        await next()
    })
}
