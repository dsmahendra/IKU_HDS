// Production server for Railway: serves the built app from /dist and the
// /api/auth/* endpoints (on Vercel these run as serverless functions instead)
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { handleLogin, handleLogout, handleSession } from './api/_auth.js'

const DIST = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist')
const PORT = process.env.PORT || 3000

const routes = {
  '/api/auth/login': handleLogin,
  '/api/auth/logout': handleLogout,
  '/api/auth/session': handleSession,
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

function serveFile(res, file) {
  const ext = path.extname(file)
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream')
  res.setHeader(
    'Cache-Control',
    file.includes(`${path.sep}assets${path.sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache'
  )
  fs.createReadStream(file).pipe(res)
}

http
  .createServer((req, res) => {
    const url = req.url.split('?')[0]

    const handler = routes[url]
    if (handler) return handler(req, res)

    if (url.startsWith('/api/')) {
      res.statusCode = 404
      return res.end('Not found')
    }

    // Static file if it exists, otherwise fall back to index.html (SPA routing)
    const file = path.join(DIST, path.normalize(decodeURIComponent(url)))
    if (file.startsWith(DIST) && fs.existsSync(file) && fs.statSync(file).isFile()) {
      return serveFile(res, file)
    }
    serveFile(res, path.join(DIST, 'index.html'))
  })
  .listen(PORT, () => console.log(`Admin frontend listening on port ${PORT}`))
