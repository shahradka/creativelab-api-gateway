# API Gateway

Cloudflare Workers + Hono API gateway with a config-driven routing layer.

## Setup

```txt
pnpm install
pnpm dev
```

## Deploy

```txt
pnpm deploy
```

## Type checking

```txt
pnpm typecheck
```

## Configuration

- **Routes** live in [`src/config/routes.ts`](src/config/routes.ts). Each rule declares its path, allowed methods, auth requirement, rate-limit policy and upstream target (`targetBinding` for a Worker service binding or `targetBaseUrl` for an HTTP upstream).
- **Service bindings and rate limits** are declared in [`wrangler.jsonc`](wrangler.jsonc).
- **Protected routes** require the `API_KEY` secret:

  ```txt
  wrangler secret put API_KEY
  ```

  Clients may send it as `x-api-key: <key>` or `Authorization: Bearer <key>`.

- **CORS** is restricted to the comma-separated `CORS_ORIGINS` variable. Set it to `*` to allow every origin.

## Service-to-service authentication

Every request the gateway proxies to an upstream service is signed with a
short-lived HS256 JWT. This prevents attackers from calling your services
directly from another domain: the upstream only accepts requests that carry a
token signed with the shared private secret.

### 1. Create the private secret

Generate a strong random value once and store it as a secret on **both** the
gateway and every upstream service:

```txt
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
wrangler secret put SERVICE_JWT_SECRET
```

Run `wrangler secret put SERVICE_JWT_SECRET` in the gateway project **and** in
each upstream Worker project (for example `rag-ai-cv`). The value must be
identical everywhere.

Optional variables (already set in [`wrangler.jsonc`](wrangler.jsonc)):

| Variable | Default | Purpose |
| --- | --- | --- |
| `SERVICE_JWT_ISSUER` | `api-gateway` | `iss` claim written into the token |
| `SERVICE_JWT_AUDIENCE` | `internal-services` | `aud` claim written into the token |
| `SERVICE_JWT_TTL_SECONDS` | `60` | Token lifetime in seconds |

### 2. What the gateway sends

The gateway mints a fresh token per request and forwards it in the
`x-service-token` header. Any client-supplied value is overwritten, so it cannot
be spoofed. The token contains `iss`, `aud`, `sub`, `iat`, `exp`, `jti` plus the
matched `route`, `method` and `path`.

If `SERVICE_JWT_SECRET` is missing, the gateway fails closed with a `500` and
never forwards the request.

### 3. Verify the token inside an upstream service

The shared helpers live in [`src/core/security/service-token.ts`](src/core/security/service-token.ts)
and the ready-to-use Hono middleware in [`src/middlewares/service-token.ts`](src/middlewares/service-token.ts).
Copy them into the upstream project (or publish them as a shared package) and
protect the routes:

```ts
import { Hono } from 'hono'
import { createServiceTokenMiddleware } from './middlewares/service-token'

type Env = {
    Bindings: {
        SERVICE_JWT_SECRET: string
        SERVICE_JWT_ISSUER?: string
        SERVICE_JWT_AUDIENCE?: string
    }
}

const app = new Hono<Env>()

app.use(
    '*',
    createServiceTokenMiddleware({
        secret: c.env.SERVICE_JWT_SECRET,
        issuer: c.env.SERVICE_JWT_ISSUER,
        audience: c.env.SERVICE_JWT_AUDIENCE,
    })
)

app.post('/api/public/v1/rag-ai-cv', (c) => {
    const claims = c.get('serviceTokenClaims')
    // claims.route, claims.method, claims.path, claims.jti, ...
    return c.json({ ok: true })
})
```

Requests without a valid, unexpired token are rejected with `401`. Because the
secret never leaves your Cloudflare account, other domains cannot mint a valid
token even if they discover the service URL.

## Generating Cloudflare types

```txt
pnpm cf-typegen
```

Pass the generated `CloudflareBindings` as generics when instantiating `Hono` if you prefer generated types over the hand-written [`AppEnv`](src/config/env.ts).
