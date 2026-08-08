import { FetchProxyWorkerService } from "@/adapters/out/proxy/fetch-proxy-worker.service"
import { ProxyRequestWorkerUseCase } from "@/core/usecases/proxy-request-worker.usecase"
import { Hono } from "hono"

type Env = {
    Bindings: {

    }
}

const protectedRoutes = new Hono<Env>()

const proxyService = new FetchProxyWorkerService()

const proxyRequestUseCase = new ProxyRequestWorkerUseCase(proxyService)

//@todo add this line protectedRoutes.use('*', authMiddleware)

export default protectedRoutes