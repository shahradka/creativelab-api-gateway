import { rateLimiter } from 'hono-rate-limiter'
import type { RateLimit } from '@cloudflare/workers-types'
import type { AppEnv } from '@/config/env'

export const createRateLimiter = (bindingName: string, prefix = 'global') => {
    return rateLimiter<AppEnv>({
        binding: (c) => c.env[bindingName] as RateLimit,
        keyGenerator: (c) => {
            const identifier =
                c.req.header('x-api-key') ?? c.req.header('cf-connecting-ip') ?? 'anon'
            return `${prefix}:${identifier}`
        },
        message: { error: 'Rate limit exceeded, please try again later.' },
    })
}
