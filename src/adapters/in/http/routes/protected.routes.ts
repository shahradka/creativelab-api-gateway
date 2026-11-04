import { appRoutes } from '@/config/routes'
import { createGatewayRoutes } from './gateway.routes'

const protectedRoutes = createGatewayRoutes(appRoutes.filter((rule) => rule.isProtected))

export default protectedRoutes
