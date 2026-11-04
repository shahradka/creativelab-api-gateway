import { appRoutes } from '@/config/routes'
import { createGatewayRoutes } from './gateway.routes'

const publicRoutes = createGatewayRoutes(appRoutes.filter((rule) => !rule.isProtected))

export default publicRoutes
