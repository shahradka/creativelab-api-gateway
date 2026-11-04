import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import publicRoutes from './adapters/in/http/routes/public.routes'
import protectedRoutes from './adapters/in/http/routes/protected.routes'
import type { AppEnv } from './config/env'

const app = new Hono<AppEnv>()

app.use('*', logger())
app.use(
    '*',
    cors({
        origin: (origin, c) => {
            const rawOrigins: string = c.env.CORS_ORIGINS ?? ''
            const allowedOrigins = rawOrigins
                .split(',')
                .map((value: string) => value.trim())
                .filter(Boolean)

            if (allowedOrigins.includes('*')) {
                return origin || '*'
            }

            if (!origin) {
                return undefined
            }

            return allowedOrigins.includes(origin) ? origin : undefined
        },
        allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
        maxAge: 86400,
    })
)

app.route('/', publicRoutes)
app.route('/', protectedRoutes)

app.get('/', (c) => {
    return c.text('Hello Hono!')
})

export default app
