// Shared auth helpers for the /api/auth/* serverless functions.
// Files starting with "_" are not deployed as their own endpoints on Vercel.
import crypto from 'node:crypto'

export const COOKIE_NAME = 'hds_admin_session'
const SESSION_HOURS = 12

function config() {
  const { ADMIN_USERNAME, ADMIN_PASSWORD, AUTH_SECRET } = process.env
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !AUTH_SECRET) return null
  return { username: ADMIN_USERNAME, password: ADMIN_PASSWORD, secret: AUTH_SECRET }
}

// Constant-time string comparison (hashing first makes lengths equal)
function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest()
  const hb = crypto.createHash('sha256').update(String(b)).digest()
  return crypto.timingSafeEqual(ha, hb)
}

function sign(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url')
}

function createToken(username, secret) {
  const payload = Buffer.from(
    JSON.stringify({ u: username, exp: Date.now() + SESSION_HOURS * 3600 * 1000 })
  ).toString('base64url')
  return `${payload}.${sign(payload, secret)}`
}

function verifyToken(token, secret) {
  if (!token || !token.includes('.')) return null
  const [payload, signature] = token.split('.')
  if (!safeEqual(signature, sign(payload, secret))) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return data.exp > Date.now() ? data : null
  } catch {
    return null
  }
}

function readCookie(req, name) {
  const cookies = req.headers.cookie || ''
  const match = cookies.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null
}

function sessionCookie(value, maxAgeSeconds) {
  const secure = process.env.VERCEL || process.env.RAILWAY_ENVIRONMENT ? '; Secure' : ''
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSeconds}${secure}`
}

async function readJsonBody(req) {
  if (req.body !== undefined) {
    return typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
  }
  let raw = ''
  for await (const chunk of req) raw += chunk
  return raw ? JSON.parse(raw) : {}
}

function send(res, status, data) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(data))
}

export async function handleLogin(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' })

  const cfg = config()
  if (!cfg) return send(res, 500, { error: 'Login is not configured on the server' })

  let body
  try {
    body = await readJsonBody(req)
  } catch {
    return send(res, 400, { error: 'Invalid request body' })
  }

  const userOk = safeEqual(body.username || '', cfg.username)
  const passOk = safeEqual(body.password || '', cfg.password)
  if (!userOk || !passOk) {
    // Small delay to slow down password guessing
    await new Promise((r) => setTimeout(r, 800))
    return send(res, 401, { error: 'Invalid username or password' })
  }

  res.setHeader('Set-Cookie', sessionCookie(createToken(cfg.username, cfg.secret), SESSION_HOURS * 3600))
  return send(res, 200, { authenticated: true, username: cfg.username })
}

export function handleLogout(req, res) {
  res.setHeader('Set-Cookie', sessionCookie('', 0))
  return send(res, 200, { authenticated: false })
}

export function handleSession(req, res) {
  const cfg = config()
  const session = cfg && verifyToken(readCookie(req, COOKIE_NAME), cfg.secret)
  return session
    ? send(res, 200, { authenticated: true, username: session.u })
    : send(res, 401, { authenticated: false })
}
