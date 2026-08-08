import { FetchProxyHttpService } from "@/adapters/out/proxy/fetch-proxy-http.service"
import { Hono } from "hono"
import type { Fetcher } from "@cloudflare/workers-types"
import { ProxyRequestHttpUseCase } from "@/core/usecases/proxy-request-http.usecase"
import { ProxyRequestWorkerUseCase } from "@/core/usecases/proxy-request-worker.usecase"
import { FetchProxyWorkerService } from "@/adapters/out/proxy/fetch-proxy-worker.service"
import { createRateLimiter } from "@/middlewares/ratelimiter"

type Env = {
    Bindings:{
        RAG_AI_CV: Fetcher
    }
}

const publicRoutes = new Hono<Env>()

const proxyHttpService = new FetchProxyHttpService()

const proxyRequestHttpUseCase  = new ProxyRequestHttpUseCase(proxyHttpService)

const proxyWorkerService = new FetchProxyWorkerService()

const proxyRequestWorkerUseCase  = new ProxyRequestWorkerUseCase(proxyWorkerService)

publicRoutes.post("/v1/rag-ai-cv", createRateLimiter("EXPENSIVE_RATE_LIMIT", "RAG_AI_CV"),async (context) => {
    return proxyRequestWorkerUseCase.execute(context.req.raw, context.env.RAG_AI_CV)
})

export default publicRoutes