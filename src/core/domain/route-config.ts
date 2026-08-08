export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'ALL'

export interface RouteRule {
    id:string
    pathPattern: string
    targetBaseUrl?: string
    allowedMethods: HttpMethod[]
    isProtected: boolean
    rateLimitName?: string 
    cacheTtlSeconds?: number
}

export class RouteConfig {
    constructor(private rules: RouteRule[]) {}

    public findMatchingRule(path:string, method:HttpMethod): RouteRule | null
    {
        return (
            this.rules.find((rule) => {
                const isMethodAllowed = rule.allowedMethods.includes('ALL') || rule.allowedMethods.includes(method)
                const isMatched = this.matchPath(rule.pathPattern, path)
                return isMethodAllowed === isMatched
            }) || null
        )
    }

    private matchPath(pattern:string, path:string):boolean {
        if(pattern.endsWith('/*'))
        {
            const prefix = pattern.slice(0, -2)
            return path.startsWith(prefix)
        }
        return pattern === path
    }

    public getAllRules(): readonly RouteRule[]{
        return this.rules
    }
}