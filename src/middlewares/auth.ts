import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '@/config/env'

/**
 * API-key authentication for protected routes.
 *
 * Accepts either `x-api-key: <key>` or `Authorization: Bearer <key>`.
 * The expected key is read from the `API_KEY` secret.
 */
export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
    const expectedApiKey = c.env.API_KEY

    if (!expectedApiKey) {
        return c.json({ error: 'Server misconfigured: API_KEY is not set' }, 500)
    }

    const authorization = c.req.header('authorization')
    const bearerToken = authorization?.replace(/^Bearer\s+/i, '')
    const providedApiKey = c.req.header('x-api-key') ?? bearerToken

    if (!providedApiKey || providedApiKey !== expectedApiKey) {
        return c.json({ error: 'Unauthorized' }, 401)
    }

    await next()
})
