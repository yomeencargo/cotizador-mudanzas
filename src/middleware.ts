import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySessionToken } from '@/lib/adminSession'
import {
  checkRateLimit,
  findRateLimitRule,
  getClientIp,
  isRateLimitExempt,
} from '@/lib/rateLimit'

// Rutas de admin que NO requieren sesión válida.
const PUBLIC_ADMIN_PATHS = new Set<string>(['/admin/login'])

// Endpoints /api/admin/* de SOLO LECTURA (GET) que el cotizador público necesita para
// funcionar sin sesión: catálogo de items, configuración de precios y de agenda. Son
// datos que el cotizador ya muestra a cualquier visitante. Las MUTACIONES (POST/PUT/
// PATCH/DELETE) sobre estos mismos paths siguen exigiendo sesión de admin.
const PUBLIC_ADMIN_READ_APIS = new Set<string>([
  '/api/admin/catalog-items',
  '/api/admin/pricing-config',
  '/api/admin/schedule-config',
])

/**
 * Rate limit por IP sobre /api/*. Devuelve una respuesta 429 si hay que cortar, o null
 * para seguir. Se aplica ANTES de la comprobación de sesión para que también proteja el
 * login de admin contra fuerza bruta.
 */
function enforceRateLimit(request: NextRequest, pathname: string): NextResponse | null {
  if (!pathname.startsWith('/api/')) return null
  if (isRateLimitExempt(pathname)) return null

  const rule = findRateLimitRule(pathname)
  if (!rule) return null

  const ip = getClientIp(request.headers, request.ip)
  const result = checkRateLimit(ip, rule)

  if (result.ok) return null

  console.warn(
    `[rate-limit] 429 ${pathname} ip=${ip} bucket=${rule.bucket} limit=${rule.limit}`
  )

  return NextResponse.json(
    { error: 'Demasiadas peticiones. Intenta de nuevo en unos minutos.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfterSec),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': '0',
        'Cache-Control': 'no-store',
      },
    }
  )
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1) Rate limit: primero, y para toda /api/* (pública y de admin).
  const limited = enforceRateLimit(request, pathname)
  if (limited) return limited

  // 2) Autenticación de admin.
  const isAdminPage = pathname.startsWith('/admin')
  const isAdminApi = pathname.startsWith('/api/admin')

  // Solo custodiamos páginas de admin y APIs de admin.
  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next()
  }

  // Excepciones públicas / de sistema.
  if (PUBLIC_ADMIN_PATHS.has(pathname)) return NextResponse.next()
  if (pathname.startsWith('/api/admin/auth/')) return NextResponse.next() // login + logout
  // Cron de Vercel (definido en vercel.json). Debería auto-protegerse con CRON_SECRET.
  if (pathname === '/api/admin/cleanup-bookings') return NextResponse.next()
  // Lectura pública del catálogo/precios/agenda que consume el cotizador (solo GET).
  if (request.method === 'GET' && PUBLIC_ADMIN_READ_APIS.has(pathname)) {
    return NextResponse.next()
  }

  const token = request.cookies.get('admin_authenticated')?.value
  const isAuthenticated = await verifySessionToken(token)

  if (!isAuthenticated) {
    if (isAdminApi) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const loginUrl = new URL('/admin/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  // `/api/:path*` cubre también `/api/admin/:path*`.
  matcher: ['/admin/:path*', '/api/:path*'],
}
