import type { Fetcher, RateLimit } from '@cloudflare/workers-types'
import type { ServiceTokenClaims } from '@/core/security/service-token'

/**
 * Shared Hono environment for the gateway.
 *
 * Keep the concrete bindings here so every adapter, middleware and route
 * shares the same `c.env` typing instead of re-declaring empty `Env` types.
 */
export type AppEnv = {
    Bindings: {
        RAG_AI_CV: Fetcher
        EXPENSIVE_RATE_LIMIT: RateLimit
        /** Secret used by the auth middleware for protected routes. */
        API_KEY?: string
        /** Comma-separated list of allowed CORS origins. Use `*` to allow all. */
        CORS_ORIGINS?: string
        /**
         * Private secret shared between the gateway and its upstream services.
         * The gateway signs a short-lived JWT with it and every upstream service
         * verifies the same JWT with the exact same value.
         */
        SERVICE_JWT_SECRET?: string
        /** `iss` claim written into service tokens. Defaults to `api-gateway`. */
        SERVICE_JWT_ISSUER?: string
        /** `aud` claim written into service tokens. Defaults to `internal-services`. */
        SERVICE_JWT_AUDIENCE?: string
        /** Lifetime of a service token in seconds. Defaults to `60`. */
        SERVICE_JWT_TTL_SECONDS?: string
        [binding: string]: unknown
    }
    Variables: {
        /** Populated by the service-token middleware after a successful verification. */
        serviceTokenClaims?: ServiceTokenClaims
    }
}
