// src/middlewares/rate-limiter.ts
import { rateLimiter } from "hono-rate-limiter"
import type { RateLimit } from "@cloudflare/workers-types"

type Env = {
  Bindings: Record<string, any>
}

export const createRateLimiter = (
  bindingName: string,
  prefix: string = "global"
) => {
  return rateLimiter<Env>({
    binding: (c) => c.env[bindingName] as RateLimit,
    keyGenerator: (c) => {
      const identifier = c.req.header("x-api-key") ?? c.req.header("cf-connecting-ip") ?? "anon"
      return `${prefix}:${identifier}`
    },
    message: { error: "Rate limit exceeded, please try again later." },
  })
}