import { RouteRule } from "../core/domain/route-config";

export const appRoutes: RouteRule[] = [
    {
        allowedMethods: ["POST"],
        id:"public-ai-cv-rag",
        isProtected: false,
        pathPattern: '/api/public/v1/ai-cv-rag',
        cacheTtlSeconds: 10,
        rateLimitName: 'EXPENSIVE_RATE_LIMIT'
    }
]