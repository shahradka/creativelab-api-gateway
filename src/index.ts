import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import publicRoutes from './adapters/in/http/routes/public.routes'
import protectedRoutes from './adapters/in/http/routes/protected.routes'

type Env = {

}

const app = new Hono()

app.use('*', logger())
app.use('*', cors())

app.route('/api/public', publicRoutes)

app.route('/api/protected', protectedRoutes)

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

export default app
