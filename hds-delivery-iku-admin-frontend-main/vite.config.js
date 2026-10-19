import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { handleLogin, handleLogout, handleSession } from './api/_auth.js'

// Serves the /api/auth/* serverless functions during `npm run dev`
// (on Vercel they run as real functions from the /api folder)
function devAuthApi() {
  const routes = {
    '/api/auth/login': handleLogin,
    '/api/auth/logout': handleLogout,
    '/api/auth/session': handleSession,
  }
  return {
    name: 'dev-auth-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const handler = routes[req.url.split('?')[0]]
        handler ? handler(req, res) : next()
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // Make ADMIN_USERNAME / ADMIN_PASSWORD / AUTH_SECRET from .env available to the dev auth handlers
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))

  return {
    plugins: [react(), devAuthApi()],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  }
})
