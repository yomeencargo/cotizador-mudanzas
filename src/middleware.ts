import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySessionToken } from '@/lib/adminSession'

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
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
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
