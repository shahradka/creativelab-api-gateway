import { signServiceToken } from '@/core/security/service-token'
import type { IServiceTokenSigner, ServiceTokenContext } from '@/core/ports/service-token.port'

export interface JwtServiceTokenConfig {
    secret: string
    issuer?: string
    audience?: string
    ttlSeconds?: number
}

/** Env shape required to build a signer from `c.env`. */
export interface ServiceTokenEnv {
    SERVICE_JWT_SECRET?: string
    SERVICE_JWT_ISSUER?: string
    SERVICE_JWT_AUDIENCE?: string
    SERVICE_JWT_TTL_SECONDS?: string
}

/** HS256 JWT signer backed by the shared `SERVICE_JWT_SECRET`. */
export class JwtServiceTokenSigner implements IServiceTokenSigner {
    constructor(private readonly config: JwtServiceTokenConfig) {}

    async sign(context?: ServiceTokenContext): Promise<string> {
        return signServiceToken({
            secret: this.config.secret,
            issuer: this.config.issuer,
            audience: this.config.audience,
            ttlSeconds: this.config.ttlSeconds,
            claims: {
                ...(context?.routeId ? { route: context.routeId } : {}),
                ...(context?.method ? { method: context.method } : {}),
                ...(context?.path ? { path: context.path } : {}),
            },
        })
    }
}

/**
 * Builds a signer from the Worker environment.
 *
 * Returns `null` when `SERVICE_JWT_SECRET` is missing so callers can fail
 * closed instead of forwarding unsigned requests to upstream services.
 */
export function createJwtServiceTokenSigner(env: ServiceTokenEnv): JwtServiceTokenSigner | null {
    if (!env.SERVICE_JWT_SECRET) {
        return null
    }

    const ttl = Number(env.SERVICE_JWT_TTL_SECONDS)

    return new JwtServiceTokenSigner({
        secret: env.SERVICE_JWT_SECRET,
        issuer: env.SERVICE_JWT_ISSUER,
        audience: env.SERVICE_JWT_AUDIENCE,
        ttlSeconds: Number.isFinite(ttl) && ttl > 0 ? ttl : undefined,
    })
}
