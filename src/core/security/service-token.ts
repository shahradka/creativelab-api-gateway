import { sign, verify } from 'hono/jwt'

/**
 * Header used to carry the gateway-issued service token.
 *
 * The gateway always overwrites this header before proxying, so a client can
 * never smuggle its own value to an upstream service.
 */
export const SERVICE_TOKEN_HEADER = 'x-service-token'

export const DEFAULT_SERVICE_TOKEN_ISSUER = 'api-gateway'
export const DEFAULT_SERVICE_TOKEN_AUDIENCE = 'internal-services'
export const DEFAULT_SERVICE_TOKEN_TTL_SECONDS = 60

/** Claims written into every service token. */
export interface ServiceTokenClaims {
    iss: string
    aud: string | string[]
    sub: string
    iat: number
    exp: number
    jti: string
    [claim: string]: unknown
}

export interface SignServiceTokenOptions {
    /** Shared private secret. Must match the value used by upstream services. */
    secret: string
    issuer?: string
    audience?: string
    ttlSeconds?: number
    subject?: string
    /** Extra, non-reserved claims (e.g. route id, method, path). */
    claims?: Record<string, unknown>
}

export interface VerifyServiceTokenOptions {
    /** Shared private secret. Must match the value used by the gateway. */
    secret: string
    issuer?: string
    audience?: string
}

/**
 * Signs a short-lived HS256 JWT that proves a request came from the gateway.
 *
 * The token is intentionally short-lived (60s by default) and single-use in
 * spirit: it is minted per request and only meant to travel gateway -> service.
 */
export async function signServiceToken(options: SignServiceTokenOptions): Promise<string> {
    const {
        secret,
        issuer = DEFAULT_SERVICE_TOKEN_ISSUER,
        audience = DEFAULT_SERVICE_TOKEN_AUDIENCE,
        ttlSeconds = DEFAULT_SERVICE_TOKEN_TTL_SECONDS,
        subject = DEFAULT_SERVICE_TOKEN_ISSUER,
        claims = {},
    } = options

    if (!secret) {
        throw new Error('SERVICE_JWT_SECRET is required to sign service tokens')
    }

    const now = Math.floor(Date.now() / 1000)
    const payload = {
        ...claims,
        iss: issuer,
        aud: audience,
        sub: subject,
        iat: now,
        exp: now + ttlSeconds,
        jti: crypto.randomUUID(),
    }

    return sign(payload, secret, 'HS256')
}

/**
 * Verifies a service token and returns its claims.
 *
 * Throws when the signature is invalid, the token is expired, or the
 * `iss`/`aud` claims do not match the expected values.
 */
export async function verifyServiceToken(
    token: string,
    options: VerifyServiceTokenOptions
): Promise<ServiceTokenClaims> {
    const {
        secret,
        issuer = DEFAULT_SERVICE_TOKEN_ISSUER,
        audience = DEFAULT_SERVICE_TOKEN_AUDIENCE,
    } = options

    if (!secret) {
        throw new Error('SERVICE_JWT_SECRET is required to verify service tokens')
    }

    // `verify` validates the HS256 signature and the `exp` claim.
    const claims = (await verify(token, secret, 'HS256')) as ServiceTokenClaims

    if (claims.iss !== issuer) {
        throw new Error('Invalid service token issuer')
    }

    const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud]
    if (!audiences.includes(audience)) {
        throw new Error('Invalid service token audience')
    }

    return claims
}
