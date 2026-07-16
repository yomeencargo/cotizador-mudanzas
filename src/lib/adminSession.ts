// Sesión de administrador firmada (HMAC-SHA256). Compatible con Edge (middleware)
// y Node (route handlers) porque usa Web Crypto global (globalThis.crypto.subtle).
//
// El valor de la cookie `admin_authenticated` deja de ser el string forjable 'true'
// y pasa a ser un token firmado `v1.<exp>.<firma>`, verificable solo con el secreto
// del servidor. Así, además de proteger las páginas, protegemos las APIs /api/admin/*.

const TOKEN_VERSION = 'v1'
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000 // 24h, alineado con el maxAge de la cookie

function getSecret(): string {
  // Preferimos un secreto dedicado; si no existe, derivamos del password de admin.
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || ''
}

const encoder = new TextEncoder()

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function hmac(data: string, secret: string): Promise<string> {
  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await globalThis.crypto.subtle.sign('HMAC', key, encoder.encode(data))
  return toBase64Url(new Uint8Array(signature))
}

// Comparación en tiempo constante de dos strings (firmas base64url) para evitar
// timing attacks. Devuelve false si difieren en largo o contenido.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}

export async function createSessionToken(ttlMs: number = DEFAULT_TTL_MS): Promise<string> {
  const secret = getSecret()
  const exp = Date.now() + ttlMs
  const payload = `${TOKEN_VERSION}.${exp}`
  const signature = await hmac(payload, secret)
  return `${payload}.${signature}`
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false
  const secret = getSecret()
  if (!secret) return false

  const parts = token.split('.')
  if (parts.length !== 3) return false

  const [version, expStr, signature] = parts
  if (version !== TOKEN_VERSION) return false

  const exp = Number(expStr)
  if (!Number.isFinite(exp) || Date.now() > exp) return false

  const expected = await hmac(`${version}.${expStr}`, secret)
  return safeEqual(signature, expected)
}
