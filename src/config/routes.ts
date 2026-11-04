import type { RouteRule } from '@/core/domain/route-config'

export const appRoutes: RouteRule[] = [
    {
        id: 'public-ai-cv-rag',
        pathPattern: '/api/public/v1/rag-ai-cv',
        targetBinding: 'RAG_AI_CV',
        allowedMethods: ['POST'],
        isProtected: false,
        cacheTtlSeconds: 10,
        rateLimitName: 'EXPENSIVE_RATE_LIMIT',
    },
]
